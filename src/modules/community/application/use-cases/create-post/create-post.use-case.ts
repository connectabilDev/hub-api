import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePostDto } from '../../dtos/create-post.dto';
import { PostDto } from '../../dtos/post.dto';
import { PostMapper } from '../../mappers/post.mapper';
import { Post } from '../../../domain/entities/post.entity';
import { PostContent } from '../../../domain/value-objects/post-content.vo';
import { MediaAttachment } from '../../../domain/value-objects/media-attachment.vo';
import type { PostRepositoryInterface } from '../../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import {
  QueueName,
  NotificationJobData,
  MediaJobData,
  AnalyticsJobData,
} from '../../../../shared/infrastructure/queue/queue.types';

@Injectable()
export class CreatePostUseCase {
  private readonly logger = new Logger(CreatePostUseCase.name);

  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryInterface,
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<NotificationJobData>,
    @InjectQueue(QueueName.MEDIA)
    private readonly mediaQueue: Queue<MediaJobData>,
    @InjectQueue(QueueName.ANALYTICS)
    private readonly analyticsQueue: Queue<AnalyticsJobData>,
    private readonly postMapper: PostMapper,
  ) {}

  async execute(dto: CreatePostDto): Promise<PostDto> {
    this.logger.log(`Creating post for user ${dto.userId}`);

    if (!dto.userId) {
      throw new Error('User ID is required');
    }

    const postContent = PostContent.create(dto.content);

    const mediaAttachments =
      dto.media?.map((media) => {
        return MediaAttachment.create(
          media.url,
          media.type,
          media.size,
          media.mimeType,
          media.thumbnailUrl,
          media.fileName,
        );
      }) || [];

    const mediaItems = mediaAttachments.map((attachment) => ({
      id: crypto.randomUUID(),
      type: attachment.getType().toLowerCase() as
        | 'image'
        | 'video'
        | 'document',
      url: attachment.getUrl(),
      thumbnailUrl: attachment.getThumbnailUrl(),
      filename: attachment.getFileName(),
      size: attachment.getSize(),
    }));

    const post = Post.create({
      userId: dto.userId,
      content: postContent.getValue(),
      visibility: dto.visibility!,
      media: mediaItems,
      tags: dto.tags || [],
    });

    const savedPost = await this.postRepository.save(post);

    await this.queueBackgroundTasks(savedPost, mediaAttachments);

    this.logger.log(`Post created successfully: ${savedPost.id}`);

    return this.postMapper.toDto(savedPost, dto.userId);
  }

  private async queueBackgroundTasks(
    post: Post,
    mediaAttachments: MediaAttachment[],
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (mediaAttachments.length > 0) {
      const mediaJob = this.mediaQueue.add(
        'process_media',
        {
          fileId: post.id,
          filePath: '',
          userId: post.userId,
          type: 'image_resize',
          options: {
            sizes: [150, 300, 600],
            quality: 85,
            format: 'webp',
          },
        },
        {
          priority: 5,
          delay: 2000,
        },
      );
      tasks.push(mediaJob.then(() => {}));
    }

    const notificationJob = this.notificationQueue.add(
      'post_created',
      {
        userId: post.userId,
        type: 'post_created',
        entityId: post.id,
        message: 'New post created',
        metadata: {
          timestamp: new Date(),
          hasMedia: mediaAttachments.length > 0,
          tagCount: post.tags.length,
        },
      },
      {
        priority: 8,
        delay: 1000,
      },
    );
    tasks.push(notificationJob.then(() => {}));

    const analyticsJob = this.analyticsQueue.add(
      'track_post_creation',
      {
        eventType: 'post_view',
        userId: post.userId,
        entityId: post.id,
        properties: {
          contentLength: post.content.length,
          mediaCount: mediaAttachments.length,
          tagCount: post.tags.length,
          visibility: post.visibility,
          source: 'web',
        },
        timestamp: new Date(),
      },
      {
        priority: 3,
        delay: 5000,
      },
    );
    tasks.push(analyticsJob.then(() => {}));

    await Promise.allSettled(tasks);
  }
}
