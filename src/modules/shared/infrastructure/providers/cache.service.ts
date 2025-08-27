import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { CacheKey } from '../queue/queue.types';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly defaultTTL = 3600;

  private readonly cacheKeys: CacheKey = {
    USER_FEED: (userId: string) => `feed:user:${userId}`,
    USER_PROFILE: (userId: string) => `profile:user:${userId}`,
    POST_DETAILS: (postId: string) => `post:${postId}`,
    FEED_TIMELINE: (userId: string, page: number) =>
      `timeline:user:${userId}:page:${page}`,
  };

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(
        `Cache delete pattern error for pattern ${pattern}:`,
        error,
      );
    }
  }

  async increment(key: string, by: number = 1, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incrby(key, by);
      if (ttl && result === by) {
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async getCachedFeed(
    userId: string,
    page: number = 1,
  ): Promise<unknown[] | null> {
    const key = this.cacheKeys.FEED_TIMELINE(userId, page);
    return this.get<unknown[]>(key);
  }

  async cacheFeed(
    userId: string,
    feedData: unknown[],
    page: number = 1,
    ttl: number = 1800,
  ): Promise<void> {
    const key = this.cacheKeys.FEED_TIMELINE(userId, page);
    await this.set(key, feedData, ttl);
  }

  async invalidateUserFeed(userId: string): Promise<void> {
    const pattern = `timeline:user:${userId}:page:*`;
    await this.deletePattern(pattern);

    const userFeedKey = this.cacheKeys.USER_FEED(userId);
    await this.delete(userFeedKey);
  }

  async cacheUserProfile(
    userId: string,
    profileData: unknown,
    ttl: number = 3600,
  ): Promise<void> {
    const key = this.cacheKeys.USER_PROFILE(userId);
    await this.set(key, profileData, ttl);
  }

  async getCachedUserProfile(userId: string): Promise<unknown> {
    const key = this.cacheKeys.USER_PROFILE(userId);
    return this.get<unknown>(key);
  }

  async cachePostDetails(
    postId: string,
    postData: unknown,
    ttl: number = 3600,
  ): Promise<void> {
    const key = this.cacheKeys.POST_DETAILS(postId);
    await this.set(key, postData, ttl);
  }

  async getCachedPostDetails(postId: string): Promise<unknown> {
    const key = this.cacheKeys.POST_DETAILS(postId);
    return this.get<unknown>(key);
  }

  async invalidatePostCache(postId: string): Promise<void> {
    const key = this.cacheKeys.POST_DETAILS(postId);
    await this.delete(key);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
