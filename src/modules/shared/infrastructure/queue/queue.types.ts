export enum QueueName {
  NOTIFICATIONS = 'notifications',
  MEDIA = 'media',
  ANALYTICS = 'analytics',
  FEED = 'feed',
  MESSAGES = 'messages',
}

export interface NotificationJobData {
  userId: string;
  type: 'post_created' | 'post_liked' | 'comment_added' | 'user_mentioned';
  entityId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface MediaJobData {
  fileId: string;
  filePath: string;
  userId: string;
  type: 'image_resize' | 'video_compress' | 'audio_transcribe';
  options: {
    sizes?: number[];
    quality?: number;
    format?: string;
  };
}

export interface AnalyticsJobData {
  eventType: 'post_view' | 'profile_visit' | 'engagement' | 'session';
  userId: string;
  entityId?: string;
  properties: Record<string, any>;
  timestamp: Date;
}

export interface FeedJobData {
  userId: string;
  action: 'generate' | 'invalidate' | 'update';
  postId?: string;
  followerId?: string;
  metadata?: Record<string, any>;
}

export interface MessageJobData {
  messageId: string;
  senderId: string;
  recipientId: string;
  chatId: string;
  type: 'direct_message' | 'group_message';
  content: string;
}

export interface QueueConfig {
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'exponential';
      delay: number;
    };
    delay?: number;
  };
  connection: {
    host: string;
    port: number;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
  };
}

export interface CacheKey {
  USER_FEED: (userId: string) => string;
  USER_PROFILE: (userId: string) => string;
  POST_DETAILS: (postId: string) => string;
  FEED_TIMELINE: (userId: string, page: number) => string;
}
