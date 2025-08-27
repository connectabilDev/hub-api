import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QueueName,
  NotificationJobData,
  FeedJobData,
  AnalyticsJobData,
} from '../../../shared/infrastructure/queue/queue.types';
import { CacheService } from '../../../shared/infrastructure/providers/cache.service';

@Injectable()
export class CommunityQueueService {
  constructor(
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<NotificationJobData>,
    @InjectQueue(QueueName.FEED)
    private readonly feedQueue: Queue<FeedJobData>,
    @InjectQueue(QueueName.ANALYTICS)
    private readonly analyticsQueue: Queue<AnalyticsJobData>,
    private readonly cacheService: CacheService,
  ) {}

  async notifyPostCreated(
    userId: string,
    postId: string,
    message: string,
  ): Promise<void> {
    await this.notificationQueue.add(
      'post_created',
      {
        userId,
        type: 'post_created',
        entityId: postId,
        message,
        metadata: { timestamp: new Date() },
      },
      {
        priority: 10,
        delay: 1000,
      },
    );
  }

  async notifyPostLiked(
    userId: string,
    postId: string,
    likerId: string,
  ): Promise<void> {
    await this.notificationQueue.add('post_liked', {
      userId,
      type: 'post_liked',
      entityId: postId,
      message: `Your post was liked`,
      metadata: { likerId, timestamp: new Date() },
    });
  }

  async updateUserFeed(userId: string, postId: string): Promise<void> {
    await this.feedQueue.add(
      'update_feed',
      {
        userId,
        action: 'update',
        postId,
        metadata: { timestamp: new Date() },
      },
      {
        priority: 5,
      },
    );

    await this.cacheService.invalidateUserFeed(userId);
  }

  async generateUserFeed(userId: string): Promise<void> {
    await this.feedQueue.add(
      'generate_feed',
      {
        userId,
        action: 'generate',
        metadata: { timestamp: new Date() },
      },
      {
        priority: 3,
        delay: 2000,
      },
    );
  }

  async invalidateUserFeed(userId: string): Promise<void> {
    await this.feedQueue.add(
      'invalidate_feed',
      {
        userId,
        action: 'invalidate',
        metadata: { timestamp: new Date() },
      },
      {
        priority: 8,
      },
    );

    await this.cacheService.invalidateUserFeed(userId);
  }

  async trackPostView(userId: string, postId: string): Promise<void> {
    await this.analyticsQueue.add(
      'track_view',
      {
        eventType: 'post_view',
        userId,
        entityId: postId,
        properties: {
          source: 'feed',
          device: 'web',
        },
        timestamp: new Date(),
      },
      {
        priority: 1,
        delay: 5000,
      },
    );
  }

  async trackEngagement(
    userId: string,
    postId: string,
    engagementType: string,
  ): Promise<void> {
    await this.analyticsQueue.add('track_engagement', {
      eventType: 'engagement',
      userId,
      entityId: postId,
      properties: {
        type: engagementType,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  async bulkNotifyFollowers(
    followerIds: string[],
    postId: string,
    authorId: string,
  ): Promise<void> {
    const jobs = followerIds.map((followerId) => ({
      name: 'follower_notification',
      data: {
        userId: followerId,
        type: 'post_created' as const,
        entityId: postId,
        message: 'Someone you follow posted something new',
        metadata: { authorId, timestamp: new Date() },
      },
      opts: {
        priority: 7,
      },
    }));

    await this.notificationQueue.addBulk(jobs);
  }

  async getQueueStatus(): Promise<Record<string, any>> {
    const [notificationStats, feedStats, analyticsStats] = await Promise.all([
      this.notificationQueue.getJobCounts(),
      this.feedQueue.getJobCounts(),
      this.analyticsQueue.getJobCounts(),
    ]);

    return {
      notifications: notificationStats,
      feed: feedStats,
      analytics: analyticsStats,
    };
  }
}
