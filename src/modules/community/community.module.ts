import { Module } from '@nestjs/common';
import { CommunityController } from './infrastructure/controllers/community.controller';
import { FeedController } from './infrastructure/controllers/feed.controller';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../shared/infrastructure/queue/queue.module';
import { DatabaseModule } from '../shared/infrastructure/database/database.module';

import { CreatePostUseCase } from './application/use-cases/create-post/create-post.use-case';
import { GetFeedPostsUseCase } from './application/use-cases/get-feed-posts/get-feed-posts.use-case';
import { LikePostUseCase } from './application/use-cases/like-post/like-post.use-case';
import { PostMapper } from './application/mappers/post.mapper';
import { CommunityQueueService } from './infrastructure/services/community-queue.service';

import { NotificationProcessor } from './infrastructure/processors/notification.processor';
import { MediaProcessor } from './infrastructure/processors/media.processor';
import { AnalyticsProcessor } from './infrastructure/processors/analytics.processor';

import { POST_REPOSITORY } from './domain/repositories/post.repository.interface';
import { PostRepositoryImpl } from './infrastructure/repositories/post.repository.impl';

@Module({
  imports: [AuthModule, QueueModule, DatabaseModule],
  controllers: [CommunityController, FeedController],
  providers: [
    CreatePostUseCase,
    GetFeedPostsUseCase,
    LikePostUseCase,
    PostMapper,
    CommunityQueueService,
    NotificationProcessor,
    MediaProcessor,
    AnalyticsProcessor,
    {
      provide: POST_REPOSITORY,
      useClass: PostRepositoryImpl,
    },
  ],
  exports: [
    CreatePostUseCase,
    GetFeedPostsUseCase,
    LikePostUseCase,
    PostMapper,
    CommunityQueueService,
  ],
})
export class CommunityModule {}
