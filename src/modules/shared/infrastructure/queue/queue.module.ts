import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName, QueueConfig } from './queue.types';
import { CacheService } from '../providers/cache.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): QueueConfig => ({
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QueueName.NOTIFICATIONS,
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
      {
        name: QueueName.MEDIA,
        defaultJobOptions: {
          removeOnComplete: 5,
          removeOnFail: 3,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
      {
        name: QueueName.ANALYTICS,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 20,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          delay: 5000,
        },
      },
      {
        name: QueueName.FEED,
        defaultJobOptions: {
          removeOnComplete: 15,
          removeOnFail: 5,
          attempts: 4,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        },
      },
      {
        name: QueueName.MESSAGES,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
    ),
  ],
  providers: [CacheService],
  exports: [BullModule, CacheService],
})
export class QueueModule {}
