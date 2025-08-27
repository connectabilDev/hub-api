import { Injectable, Logger, Inject } from '@nestjs/common';
import { GetFeedPostsDto } from './get-feed-posts.dto';
import { PostDto } from '../../dtos/post.dto';
import { PostMapper } from '../../mappers/post.mapper';
import type { PostRepositoryInterface } from '../../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import { PaginationParams } from '../../../domain/repositories/pagination.interface';
import { CacheService } from '../../../../shared/infrastructure/providers/cache.service';

export interface PaginatedPostsResult {
  data: PostDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class GetFeedPostsUseCase {
  private readonly logger = new Logger(GetFeedPostsUseCase.name);
  private readonly CACHE_TTL = 1800;

  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryInterface,
    private readonly postMapper: PostMapper,
    private readonly cacheService: CacheService,
  ) {}

  async execute(dto: GetFeedPostsDto): Promise<PaginatedPostsResult> {
    this.logger.log(
      `Getting feed posts for user ${dto.userId} - page ${dto.page}`,
    );

    if (!dto.userId) {
      throw new Error('User ID is required');
    }

    const cacheKey = `feed:user:${dto.userId}:page:${dto.page}:limit:${dto.limit}`;

    const cachedFeed =
      await this.cacheService.get<PaginatedPostsResult>(cacheKey);
    if (cachedFeed) {
      this.logger.log(`Cache hit for feed user ${dto.userId} page ${dto.page}`);
      return cachedFeed;
    }

    const paginationParams: PaginationParams = {
      page: dto.page!,
      limit: dto.limit!,
      sortBy: dto.sortBy || 'createdAt',
      sortOrder: dto.sortOrder || 'desc',
    };

    const result = await this.postRepository.findFeed(
      dto.userId,
      paginationParams,
    );

    const postDtos = this.postMapper.toDtoList(result.data, dto.userId);

    const paginatedResult: PaginatedPostsResult = {
      data: postDtos,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
    };

    await this.cacheService.set(cacheKey, paginatedResult, this.CACHE_TTL);

    this.logger.log(
      `Feed retrieved for user ${dto.userId} - ${result.data.length} posts`,
    );

    return paginatedResult;
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    await this.cacheService.invalidateUserFeed(userId);
    this.logger.log(`Feed cache invalidated for user ${userId}`);
  }

  async preloadFeedForUser(userId: string): Promise<void> {
    this.logger.log(`Preloading feed for user ${userId}`);

    const dto = new GetFeedPostsDto({
      userId,
      page: 1,
      limit: 20,
    });

    await this.execute(dto);
  }
}
