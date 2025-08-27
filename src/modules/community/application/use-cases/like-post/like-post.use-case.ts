import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LikePostDto, LikePostResponseDto } from './like-post.dto';
import type { PostRepositoryInterface } from '../../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import { CacheService } from '../../../../shared/infrastructure/providers/cache.service';
import {
  QueueName,
  NotificationJobData,
  AnalyticsJobData,
} from '../../../../shared/infrastructure/queue/queue.types';

@Injectable()
export class LikePostUseCase {
  private readonly logger = new Logger(LikePostUseCase.name);

  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryInterface,
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<NotificationJobData>,
    @InjectQueue(QueueName.ANALYTICS)
    private readonly analyticsQueue: Queue<AnalyticsJobData>,
    private readonly cacheService: CacheService,
  ) {}

  async execute(dto: LikePostDto): Promise<LikePostResponseDto> {
    this.logger.log(
      `Processing like/unlike for post ${dto.postId} by user ${dto.userId}`,
    );

    if (!dto.userId) {
      throw new Error('User ID is required');
    }

    const post = await this.postRepository.findById(dto.postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${dto.postId} not found`);
    }

    const wasLiked = post.isLikedBy(dto.userId);
    let updatedPost;
    let action: 'like' | 'unlike';

    if (wasLiked) {
      updatedPost = post.unlike(dto.userId);
      action = 'unlike';
      await this.postRepository.removeLike(dto.postId, dto.userId);
      await this.postRepository.decrementCounter(dto.postId, 'likes');
    } else {
      updatedPost = post.like(dto.userId);
      action = 'like';
      await this.postRepository.addLike(dto.postId, dto.userId);
      await this.postRepository.incrementCounter(dto.postId, 'likes');
    }

    await this.queueBackgroundTasks(updatedPost, dto.userId, action);

    await this.invalidateRelatedCaches(
      dto.postId,
      dto.userId,
      updatedPost.userId,
    );

    const response = new LikePostResponseDto({
      isLiked: !wasLiked,
      likesCount: updatedPost.likesCount,
      postId: dto.postId,
    });

    this.logger.log(
      `Post ${dto.postId} ${action}d by user ${dto.userId}. New count: ${updatedPost.likesCount}`,
    );

    return response;
  }

  private async queueBackgroundTasks(
    post: any,
    userId: string,
    action: 'like' | 'unlike',
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (action === 'like' && post.userId !== userId) {
      const notificationJob = this.notificationQueue.add(
        'post_liked',
        {
          userId: post.userId,
          type: 'post_liked',
          entityId: post.id,
          message: 'Someone liked your post',
          metadata: {
            likerId: userId,
            timestamp: new Date(),
          },
        },
        {
          priority: 6,
        },
      );
      tasks.push(notificationJob.then(() => {}));
    }

    const analyticsJob = this.analyticsQueue.add(
      'track_engagement',
      {
        eventType: 'engagement',
        userId: userId,
        entityId: post.id,
        properties: {
          type: action,
          postAuthor: post.userId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      {
        priority: 2,
      },
    );
    tasks.push(analyticsJob.then(() => {}));

    await Promise.allSettled(tasks);
  }

  private async invalidateRelatedCaches(
    postId: string,
    userId: string,
    postAuthorId: string,
  ): Promise<void> {
    const cacheInvalidationTasks = [
      this.cacheService.invalidatePostCache(postId),
      this.cacheService.invalidateUserFeed(userId),
    ];

    if (postAuthorId !== userId) {
      cacheInvalidationTasks.push(
        this.cacheService.invalidateUserFeed(postAuthorId),
      );
    }

    await Promise.allSettled(cacheInvalidationTasks);
  }

  async getLikeStatus(
    postId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return {
      isLiked: post.isLikedBy(userId),
      likesCount: post.likesCount,
    };
  }
}
