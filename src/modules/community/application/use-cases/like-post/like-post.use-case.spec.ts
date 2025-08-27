import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { LikePostUseCase } from './like-post.use-case';
import { LikePostDto } from './like-post.dto';
import { Post, PostVisibility } from '../../../domain/entities/post.entity';
import {
  PostRepositoryInterface,
  POST_REPOSITORY,
} from '../../../domain/repositories/post.repository.interface';
import { CacheService } from '../../../../shared/infrastructure/providers/cache.service';
import { QueueName } from '../../../../shared/infrastructure/queue/queue.types';

describe('LikePostUseCase', () => {
  let useCase: LikePostUseCase;
  let postRepository: jest.Mocked<PostRepositoryInterface>;
  let notificationQueue: any;
  let analyticsQueue: any;
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

  const mockLikedPost = new Post({
    id: 'post-id',
    userId: 'author-id',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test'],
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    likedByUserIds: ['user-id'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockNotificationQueue = {
    add: jest.fn().mockResolvedValue(Promise.resolve()),
  };

  const mockAnalyticsQueue = {
    add: jest.fn().mockResolvedValue(Promise.resolve()),
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
        LikePostUseCase,
        {
          provide: POST_REPOSITORY,
          useValue: mockPostRepository,
        },
        {
          provide: getQueueToken(QueueName.NOTIFICATIONS),
          useValue: mockNotificationQueue,
        },
        {
          provide: getQueueToken(QueueName.ANALYTICS),
          useValue: mockAnalyticsQueue,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    useCase = module.get<LikePostUseCase>(LikePostUseCase);
    postRepository = module.get(POST_REPOSITORY);
    notificationQueue = module.get(getQueueToken(QueueName.NOTIFICATIONS));
    analyticsQueue = module.get(getQueueToken(QueueName.ANALYTICS));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should like a post successfully', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'user-id',
      });

      postRepository.findById.mockResolvedValue(mockPost);

      const result = await useCase.execute(dto);

      expect(postRepository.findById).toHaveBeenCalledWith('post-id');
      expect(postRepository.addLike).toHaveBeenCalledWith('post-id', 'user-id');
      expect(postRepository.incrementCounter).toHaveBeenCalledWith(
        'post-id',
        'likes',
      );
      expect(result.isLiked).toBe(true);
      expect(result.likesCount).toBe(6);
      expect(result.postId).toBe('post-id');
    });

    it('should unlike a post successfully', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'user-id',
      });

      postRepository.findById.mockResolvedValue(mockLikedPost);

      const result = await useCase.execute(dto);

      expect(postRepository.findById).toHaveBeenCalledWith('post-id');
      expect(postRepository.removeLike).toHaveBeenCalledWith(
        'post-id',
        'user-id',
      );
      expect(postRepository.decrementCounter).toHaveBeenCalledWith(
        'post-id',
        'likes',
      );
      expect(result.isLiked).toBe(false);
      expect(result.likesCount).toBe(4);
      expect(result.postId).toBe('post-id');
    });

    it("should queue notification when liking another user's post", async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'different-user-id',
      });

      postRepository.findById.mockResolvedValue(mockPost);

      await useCase.execute(dto);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'post_liked',
        expect.objectContaining({
          userId: 'author-id',
          type: 'post_liked',
          entityId: 'post-id',
          message: 'Someone liked your post',
          metadata: expect.objectContaining({
            likerId: 'different-user-id',
          }),
        }),
        expect.objectContaining({
          priority: 6,
        }),
      );
    });

    it('should not queue notification when liking own post', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'author-id',
      });

      const ownPost = new Post({
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
      postRepository.findById.mockResolvedValue(ownPost);

      await useCase.execute(dto);

      expect(notificationQueue.add).toHaveBeenCalledTimes(0);
    });

    it('should queue analytics event', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'user-id',
      });

      postRepository.findById.mockResolvedValue(mockPost);

      await useCase.execute(dto);

      expect(analyticsQueue.add).toHaveBeenCalledWith(
        'track_engagement',
        expect.objectContaining({
          eventType: 'engagement',
          userId: 'user-id',
          entityId: 'post-id',
          properties: expect.objectContaining({
            type: 'like',
            postAuthor: 'author-id',
          }),
        }),
        expect.objectContaining({
          priority: 2,
        }),
      );
    });

    it('should invalidate related caches', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
        userId: 'user-id',
      });

      postRepository.findById.mockResolvedValue(mockPost);

      await useCase.execute(dto);

      expect(cacheService.invalidatePostCache).toHaveBeenCalledWith('post-id');
      expect(cacheService.invalidateUserFeed).toHaveBeenCalledWith('user-id');
      expect(cacheService.invalidateUserFeed).toHaveBeenCalledWith('author-id');
    });

    it('should throw NotFoundException when post not found', async () => {
      const dto = new LikePostDto({
        postId: 'non-existent-post',
        userId: 'user-id',
      });

      postRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw error when userId is not provided', async () => {
      const dto = new LikePostDto({
        postId: 'post-id',
      });

      await expect(useCase.execute(dto)).rejects.toThrow('User ID is required');
    });
  });

  describe('getLikeStatus', () => {
    it('should return like status for a post', async () => {
      postRepository.findById.mockResolvedValue(mockLikedPost);

      const result = await useCase.getLikeStatus('post-id', 'user-id');

      expect(result.isLiked).toBe(true);
      expect(result.likesCount).toBe(5);
    });

    it('should throw NotFoundException when post not found', async () => {
      postRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.getLikeStatus('non-existent-post', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
