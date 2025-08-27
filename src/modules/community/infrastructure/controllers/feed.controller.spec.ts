import { Test, TestingModule } from '@nestjs/testing';
import { FeedController } from './feed.controller';
import { CreatePostUseCase } from '../../application/use-cases/create-post/create-post.use-case';
import { GetFeedPostsUseCase } from '../../application/use-cases/get-feed-posts/get-feed-posts.use-case';
import { LikePostUseCase } from '../../application/use-cases/like-post/like-post.use-case';
import { CreatePostDto } from '../../application/dtos/create-post.dto';
import { PostDto } from '../../application/dtos/post.dto';
import { PostVisibility } from '../../domain/entities/post.entity';
import { User } from '../../../auth/domain/entities/user.entity';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../../../auth/infrastructure/guards/module-access.guard';

describe('FeedController', () => {
  let controller: FeedController;
  let createPostUseCase: jest.Mocked<CreatePostUseCase>;
  let getFeedPostsUseCase: jest.Mocked<GetFeedPostsUseCase>;
  let likePostUseCase: jest.Mocked<LikePostUseCase>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    scopes: ['community:view', 'community:post'],
    hasScope: jest.fn((scope: string) => mockUser.scopes.includes(scope)),
  } as any;

  const mockPostDto: PostDto = {
    id: 'post-123',
    userId: 'user-123',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test'],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isLiked: false,
    canEdit: true,
    canDelete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockCreatePostUseCase = {
      execute: jest.fn(),
    };

    const mockGetFeedPostsUseCase = {
      execute: jest.fn(),
    };

    const mockLikePostUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: CreatePostUseCase,
          useValue: mockCreatePostUseCase,
        },
        {
          provide: GetFeedPostsUseCase,
          useValue: mockGetFeedPostsUseCase,
        },
        {
          provide: LikePostUseCase,
          useValue: mockLikePostUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ModuleAccessGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FeedController>(FeedController);
    createPostUseCase = module.get(CreatePostUseCase);
    getFeedPostsUseCase = module.get(GetFeedPostsUseCase);
    likePostUseCase = module.get(LikePostUseCase);
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      const createPostDto = new CreatePostDto({
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
        tags: ['test'],
      });

      createPostUseCase.execute.mockResolvedValue(mockPostDto);

      const result = await controller.createPost(mockUser, createPostDto);

      expect(createPostUseCase.execute).toHaveBeenCalledWith({
        ...createPostDto,
        userId: mockUser.id,
      });
      expect(result).toEqual(mockPostDto);
    });

    it('should set user ID on create post DTO', async () => {
      const createPostDto = new CreatePostDto({
        content: 'Test post content',
      });

      createPostUseCase.execute.mockResolvedValue(mockPostDto);

      await controller.createPost(mockUser, createPostDto);

      expect(createPostDto.userId).toBe(mockUser.id);
    });
  });

  describe('getFeedPosts', () => {
    it('should get feed posts with default pagination', async () => {
      const mockFeedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      const result = await controller.getFeedPosts(mockUser, 1, 10);

      expect(getFeedPostsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          page: 1,
          limit: 10,
        }),
      );
      expect(result).toEqual({
        data: [mockPostDto],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should clamp limit to maximum of 50', async () => {
      const mockFeedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await controller.getFeedPosts(mockUser, 1, 100);

      expect(getFeedPostsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        }),
      );
    });

    it('should ensure minimum page of 1', async () => {
      const mockFeedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await controller.getFeedPosts(mockUser, 0, 10);

      expect(getFeedPostsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });
  });

  describe('getPostDetails', () => {
    it('should get post details successfully', async () => {
      const postId = 'post-123';
      const mockFeedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      const result = await controller.getPostDetails(mockUser, postId);

      expect(getFeedPostsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          page: 1,
          limit: 1,
          postId,
        }),
      );
      expect(result).toEqual(mockPostDto);
    });

    it('should throw error when post not found', async () => {
      const postId = 'non-existent-post';
      const mockFeedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await expect(controller.getPostDetails(mockUser, postId)).rejects.toThrow(
        'Post not found',
      );
    });
  });

  describe('toggleLike', () => {
    it('should toggle like successfully', async () => {
      const postId = 'post-123';
      const mockLikeResult = {
        postId: 'post-123',
        isLiked: true,
        likesCount: 1,
      };

      likePostUseCase.execute.mockResolvedValue(mockLikeResult);

      const result = await controller.toggleLike(mockUser, postId);

      expect(likePostUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          postId,
          userId: mockUser.id,
        }),
      );
      expect(result).toEqual({
        liked: true,
        likesCount: 1,
      });
    });
  });

  describe('deletePost', () => {
    it('should throw error when post not found', async () => {
      const postId = 'non-existent-post';
      const mockFeedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await expect(controller.deletePost(mockUser, postId)).rejects.toThrow(
        'Post not found',
      );
    });

    it('should throw error when user not authorized', async () => {
      const postId = 'post-123';
      const otherUserPost = {
        ...mockPostDto,
        userId: 'other-user-id',
      };
      const mockFeedResult = {
        data: [otherUserPost],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await expect(controller.deletePost(mockUser, postId)).rejects.toThrow(
        'User not authorized to delete this post',
      );
    });

    it('should throw not implemented error for valid deletion', async () => {
      const postId = 'post-123';
      const mockFeedResult = {
        data: [mockPostDto],
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      getFeedPostsUseCase.execute.mockResolvedValue(mockFeedResult);

      await expect(controller.deletePost(mockUser, postId)).rejects.toThrow(
        'Delete post functionality not implemented yet',
      );
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
