import { Test, TestingModule } from '@nestjs/testing';
import { GetFeedPostsUseCase } from './get-feed-posts.use-case';
import { GetFeedPostsDto } from './get-feed-posts.dto';
import { PostMapper } from '../../mappers/post.mapper';
import { Post, PostVisibility } from '../../../domain/entities/post.entity';
import {
  PostRepositoryInterface,
  POST_REPOSITORY,
} from '../../../domain/repositories/post.repository.interface';
import { CacheService } from '../../../../shared/infrastructure/providers/cache.service';
import { PaginatedResult } from '../../../domain/repositories/pagination.interface';

describe('GetFeedPostsUseCase', () => {
  let useCase: GetFeedPostsUseCase;
  let postRepository: jest.Mocked<PostRepositoryInterface>;
  let postMapper: jest.Mocked<PostMapper>;
  let cacheService: jest.Mocked<CacheService>;

  const mockPost = new Post({
    id: 'post-id',
    userId: 'author-id',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test'],
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    likedByUserIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPaginatedResult: PaginatedResult<Post> = {
    data: [mockPost],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const mockPostDto = {
    id: 'post-id',
    userId: 'author-id',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test'],
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    isLiked: false,
    canEdit: false,
    canDelete: false,
    createdAt: '2023-12-01T10:00:00.000Z',
    updatedAt: '2023-12-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    const mockPostRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findFeed: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addLike: jest.fn(),
      removeLike: jest.fn(),
      incrementCounter: jest.fn(),
      decrementCounter: jest.fn(),
      findTrending: jest.fn(),
    };

    const mockMapper = {
      toDto: jest.fn(),
      toDtoList: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
      increment: jest.fn(),
      getCachedFeed: jest.fn(),
      cacheFeed: jest.fn(),
      invalidateUserFeed: jest.fn(),
      cacheUserProfile: jest.fn(),
      getCachedUserProfile: jest.fn(),
      cachePostDetails: jest.fn(),
      getCachedPostDetails: jest.fn(),
      invalidatePostCache: jest.fn(),
      healthCheck: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFeedPostsUseCase,
        {
          provide: POST_REPOSITORY,
          useValue: mockPostRepository,
        },
        {
          provide: PostMapper,
          useValue: mockMapper,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    useCase = module.get<GetFeedPostsUseCase>(GetFeedPostsUseCase);
    postRepository = module.get(POST_REPOSITORY);
    postMapper = module.get(PostMapper);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return cached feed when available', async () => {
      const dto = new GetFeedPostsDto({
        userId: 'user-id',
        page: 1,
        limit: 20,
      });

      const cachedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await useCase.execute(dto);

      expect(cacheService.get).toHaveBeenCalledWith(
        'feed:user:user-id:page:1:limit:20',
      );
      expect(postRepository.findFeed).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });

    it('should fetch from database when cache miss', async () => {
      const dto = new GetFeedPostsDto({
        userId: 'user-id',
        page: 1,
        limit: 20,
      });

      cacheService.get.mockResolvedValue(null);
      postRepository.findFeed.mockResolvedValue(mockPaginatedResult);
      postMapper.toDtoList.mockReturnValue([mockPostDto]);

      const result = await useCase.execute(dto);

      expect(cacheService.get).toHaveBeenCalledWith(
        'feed:user:user-id:page:1:limit:20',
      );
      expect(postRepository.findFeed).toHaveBeenCalledWith('user-id', {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(postMapper.toDtoList).toHaveBeenCalledWith([mockPost], 'user-id');
      expect(cacheService.set).toHaveBeenCalledWith(
        'feed:user:user-id:page:1:limit:20',
        expect.objectContaining({
          data: [mockPostDto],
          total: 1,
        }),
        1800,
      );
      expect(result.data).toEqual([mockPostDto]);
    });

    it('should handle custom pagination parameters', async () => {
      const dto = new GetFeedPostsDto({
        userId: 'user-id',
        page: 2,
        limit: 10,
        sortBy: 'likesCount',
        sortOrder: 'asc',
      });

      cacheService.get.mockResolvedValue(null);
      postRepository.findFeed.mockResolvedValue(mockPaginatedResult);
      postMapper.toDtoList.mockReturnValue([mockPostDto]);

      await useCase.execute(dto);

      expect(postRepository.findFeed).toHaveBeenCalledWith('user-id', {
        page: 2,
        limit: 10,
        sortBy: 'likesCount',
        sortOrder: 'asc',
      });
    });

    it('should throw error when userId is not provided', async () => {
      const dto = new GetFeedPostsDto({
        page: 1,
        limit: 20,
      });

      await expect(useCase.execute(dto)).rejects.toThrow('User ID is required');
    });
  });

  describe('invalidateFeedCache', () => {
    it('should invalidate user feed cache', async () => {
      await useCase.invalidateFeedCache('user-id');

      expect(cacheService.invalidateUserFeed).toHaveBeenCalledWith('user-id');
    });
  });

  describe('preloadFeedForUser', () => {
    it('should preload feed for user', async () => {
      cacheService.get.mockResolvedValue(null);
      postRepository.findFeed.mockResolvedValue(mockPaginatedResult);
      postMapper.toDtoList.mockReturnValue([mockPostDto]);

      await useCase.preloadFeedForUser('user-id');

      expect(postRepository.findFeed).toHaveBeenCalledWith('user-id', {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });
});
