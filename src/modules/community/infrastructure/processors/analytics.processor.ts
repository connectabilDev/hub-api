import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  QueueName,
  AnalyticsJobData,
} from '../../../shared/infrastructure/queue/queue.types';

@Injectable()
@Processor(QueueName.ANALYTICS)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    @InjectQueue(QueueName.ANALYTICS)
    private readonly analyticsQueue: Queue<AnalyticsJobData>,
  ) {
    super();
  }

  async process(job: Job<AnalyticsJobData>): Promise<void> {
    this.logger.log(
      `Processing analytics job: ${job.name} for user ${job.data.userId}`,
    );

    try {
      switch (job.name) {
        case 'update-post-metrics':
          await this.handleUpdatePostMetrics(job.data);
          break;
        case 'track-engagement':
          await this.handleTrackEngagement(job.data);
          break;
        default:
          this.logger.warn(`Unknown analytics job type: ${job.name}`);
      }

      this.logger.log(`Successfully processed analytics job: ${job.name}`);
    } catch (error) {
      this.logger.error(`Failed to process analytics job: ${job.name}`, error);
      throw error;
    }
  }

  private async handleUpdatePostMetrics(data: AnalyticsJobData): Promise<void> {
    this.logger.log(`Updating post metrics for entity ${data.entityId}`);

    switch (data.eventType) {
      case 'post_view':
        await this.updatePostViews(data);
        break;
      case 'engagement':
        await this.updateEngagementMetrics(data);
        break;
      default:
        this.logger.warn(`Unknown post metrics event: ${data.eventType}`);
    }
  }

  private async handleTrackEngagement(data: AnalyticsJobData): Promise<void> {
    this.logger.log(`Tracking engagement for user ${data.userId}`);

    await this.trackUserEngagement(data);
    await this.updateTrendingData(data);
    await this.generateEngagementInsights(data);
  }

  private async updatePostViews(data: AnalyticsJobData): Promise<void> {
    const { entityId, userId, properties } = data;

    await this.incrementPostCounter(entityId!, 'views');

    await this.trackUserInteraction(userId, 'post_view', {
      postId: entityId,
      timestamp: data.timestamp,
      source: properties.source || 'unknown',
    });

    this.logger.log(`Updated view count for post ${entityId}`);
  }

  private async updateEngagementMetrics(data: AnalyticsJobData): Promise<void> {
    const { entityId, userId, properties } = data;
    const engagementType = properties.type as 'like' | 'comment' | 'share';

    await this.incrementPostCounter(entityId!, engagementType + 's');

    await this.trackUserInteraction(userId, engagementType, {
      postId: entityId,
      timestamp: data.timestamp,
      metadata: properties,
    });

    this.logger.log(`Updated ${engagementType} metrics for post ${entityId}`);
  }

  private async trackUserEngagement(data: AnalyticsJobData): Promise<void> {
    const { userId, eventType, properties, timestamp } = data;

    await this.recordUserActivity(userId, {
      eventType,
      timestamp,
      properties,
    });

    await this.updateUserEngagementScore(userId, eventType);

    this.logger.log(`Tracked user engagement for ${userId}: ${eventType}`);
  }

  private async updateTrendingData(data: AnalyticsJobData): Promise<void> {
    const { entityId, properties, timestamp } = data;

    if (entityId && properties.type !== 'session') {
      await this.updateTrendingScore(entityId, {
        eventType: data.eventType,
        timestamp,
        weight: this.calculateEngagementWeight(data.eventType),
      });
    }

    this.logger.log(`Updated trending data for entity ${entityId}`);
  }

  private async generateEngagementInsights(
    data: AnalyticsJobData,
  ): Promise<void> {
    const { userId, properties, timestamp } = data;

    await this.analyzeUserBehavior(userId, {
      timestamp,
      activity: data.eventType,
      context: properties,
    });

    this.logger.log(`Generated engagement insights for user ${userId}`);
  }

  private async incrementPostCounter(
    postId: string,
    counterType: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(
      `Mock: Incremented ${counterType} counter for post ${postId}`,
    );
  }

  private async trackUserInteraction(
    userId: string,
    interactionType: string,
    _metadata: Record<string, any>,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.logger.log(
      `Mock: Tracked ${interactionType} interaction for user ${userId}`,
    );
  }

  private async recordUserActivity(
    userId: string,
    activity: {
      eventType: string;
      timestamp: Date;
      properties: Record<string, any>;
    },
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 75));

    this.logger.log(
      `Mock: Recorded activity ${activity.eventType} for user ${userId}`,
    );
  }

  private async updateUserEngagementScore(
    userId: string,
    eventType: string,
  ): Promise<void> {
    const scoreIncrement = this.calculateEngagementWeight(eventType);

    await new Promise((resolve) => setTimeout(resolve, 50));

    this.logger.log(
      `Mock: Updated engagement score for user ${userId} (+${scoreIncrement})`,
    );
  }

  private async updateTrendingScore(
    entityId: string,
    scoreData: {
      eventType: string;
      timestamp: Date;
      weight: number;
    },
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(
      `Mock: Updated trending score for ${entityId} with weight ${scoreData.weight}`,
    );
  }

  private async analyzeUserBehavior(
    userId: string,
    behaviorData: {
      timestamp: Date;
      activity: string;
      context: Record<string, any>;
    },
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    this.logger.log(
      `Mock: Analyzed behavior for user ${userId}: ${behaviorData.activity}`,
    );
  }

  private calculateEngagementWeight(eventType: string): number {
    const weights: Record<string, number> = {
      post_view: 1,
      profile_visit: 2,
      engagement: 5,
      session: 3,
    };

    return weights[eventType] || 1;
  }
}
