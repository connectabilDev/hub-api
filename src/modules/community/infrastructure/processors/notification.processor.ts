import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  QueueName,
  NotificationJobData,
} from '../../../shared/infrastructure/queue/queue.types';

@Injectable()
@Processor(QueueName.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<NotificationJobData>,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(
      `Processing notification job: ${job.name} for user ${job.data.userId}`,
    );

    try {
      switch (job.name) {
        case 'new-post':
          await this.handleNewPost(job.data);
          break;
        case 'new-comment':
          await this.handleNewComment(job.data);
          break;
        case 'post-liked':
          await this.handlePostLiked(job.data);
          break;
        default:
          this.logger.warn(`Unknown notification job type: ${job.name}`);
      }

      this.logger.log(`Successfully processed notification job: ${job.name}`);
    } catch (error) {
      this.logger.error(
        `Failed to process notification job: ${job.name}`,
        error,
      );
      throw error;
    }
  }

  private async handleNewPost(data: NotificationJobData): Promise<void> {
    this.logger.log(
      `Sending new post notification to followers of user ${data.userId}`,
    );

    await this.sendNotificationToFollowers(data.userId, {
      type: 'new_post',
      title: 'New Post',
      message: data.message,
      entityId: data.entityId,
      metadata: data.metadata,
    });
  }

  private async handleNewComment(data: NotificationJobData): Promise<void> {
    this.logger.log(`Sending comment notification for post ${data.entityId}`);

    await this.sendNotificationToPostAuthor(data.entityId, {
      type: 'new_comment',
      title: 'New Comment',
      message: data.message,
      userId: data.userId,
      metadata: data.metadata,
    });
  }

  private async handlePostLiked(data: NotificationJobData): Promise<void> {
    this.logger.log(`Sending like notification for post ${data.entityId}`);

    await this.sendNotificationToPostAuthor(data.entityId, {
      type: 'post_liked',
      title: 'Post Liked',
      message: data.message,
      userId: data.userId,
      metadata: data.metadata,
    });
  }

  private async sendNotificationToFollowers(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      entityId: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    this.logger.log(
      `Mock: Sending notification to followers of user ${userId}`,
    );

    const mockFollowerIds = [`follower-1-${userId}`, `follower-2-${userId}`];

    await Promise.all(
      mockFollowerIds.map((followerId) =>
        this.sendPushNotification(followerId, notification),
      ),
    );
  }

  private async sendNotificationToPostAuthor(
    postId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      userId: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    this.logger.log(
      `Mock: Sending notification to post author for post ${postId}`,
    );

    const mockPostAuthorId = `author-${postId}`;

    await this.sendPushNotification(mockPostAuthorId, {
      ...notification,
      entityId: postId,
    });
  }

  private async sendPushNotification(
    recipientId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      entityId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(
      `Mock push notification sent to ${recipientId}: ${notification.title}`,
    );

    if (notification.metadata?.track) {
      this.trackNotificationSent(recipientId, notification);
    }
  }

  private trackNotificationSent(recipientId: string, notification: any): void {
    this.logger.log(
      `Tracking notification sent to ${recipientId} of type ${notification.type}`,
    );
  }
}
