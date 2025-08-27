import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { CreatePostUseCase } from './create-post.use-case';
import { CreatePostDto } from '../../dtos/create-post.dto';
import { PostMapper } from '../../mappers/post.mapper';
import { Post, PostVisibility } from '../../../domain/entities/post.entity';
import {
  PostRepositoryInterface,
  POST_REPOSITORY,
} from '../../../domain/repositories/post.repository.interface';
import { QueueName } from '../../../../shared/infrastructure/queue/queue.types';
import { MediaType } from '../../../domain/value-objects/media-attachment.vo';

describe('CreatePostUseCase', () => {
  let useCase: CreatePostUseCase;
  let postRepository: jest.Mocked<PostRepositoryInterface>;
  let notificationQueue: any;
  let mediaQueue: any;
  let analyticsQueue: any;
  let postMapper: PostMapper;

  const mockPost = new Post({
    id: 'post-id',
    userId: 'user-id',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test'],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    likedByUserIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockQueueJob = {
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

    const mockMapper = {
      toDto: jest.fn(),
      toDtoList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostUseCase,
        {
          provide: POST_REPOSITORY,
          useValue: mockPostRepository,
        },
        {
          provide: getQueueToken(QueueName.NOTIFICATIONS),
          useValue: mockQueueJob,
        },
        {
          provide: getQueueToken(QueueName.MEDIA),
          useValue: mockQueueJob,
        },
        {
          provide: getQueueToken(QueueName.ANALYTICS),
          useValue: mockQueueJob,
        },
        {
          provide: PostMapper,
          useValue: mockMapper,
        },
      ],
    }).compile();

    useCase = module.get<CreatePostUseCase>(CreatePostUseCase);
    postRepository = module.get(POST_REPOSITORY);
    notificationQueue = module.get(getQueueToken(QueueName.NOTIFICATIONS));
    mediaQueue = module.get(getQueueToken(QueueName.MEDIA));
    analyticsQueue = module.get(getQueueToken(QueueName.ANALYTICS));
    postMapper = module.get(PostMapper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a post successfully', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
        tags: ['test'],
      });

      const expectedPostDto = {
        id: 'post-id',
        userId: 'user-id',
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
      };

      postRepository.save.mockResolvedValue(mockPost);
      postMapper.toDto.mockReturnValue(expectedPostDto as any);

      const result = await useCase.execute(createPostDto);

      expect(postRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedPostDto);
    });

    it('should create a post with media attachments', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: 'Test post with media',
        visibility: PostVisibility.PUBLIC,
        media: [
          {
            url: 'https://example.com/image.jpg',
            type: MediaType.IMAGE,
            size: 1024000,
            mimeType: 'image/jpeg',
            fileName: 'test-image.jpg',
          },
        ],
      });

      const expectedPostDto = {
        id: 'post-id',
        userId: 'user-id',
        content: 'Test post with media',
      };

      postRepository.save.mockResolvedValue(mockPost);
      postMapper.toDto.mockReturnValue(expectedPostDto as any);

      const result = await useCase.execute(createPostDto);

      expect(postRepository.save).toHaveBeenCalledTimes(1);
      expect(mediaQueue.add).toHaveBeenCalledWith(
        'process_media',
        expect.objectContaining({
          fileId: expect.any(String),
          userId: 'user-id',
          type: 'image_resize',
        }),
        expect.objectContaining({
          priority: 5,
          delay: 2000,
        }),
      );
      expect(result).toEqual(expectedPostDto);
    });

    it('should queue notification task', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
      });

      postRepository.save.mockResolvedValue(mockPost);
      postMapper.toDto.mockReturnValue({} as any);

      await useCase.execute(createPostDto);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'post_created',
        expect.objectContaining({
          userId: 'user-id',
          type: 'post_created',
          entityId: expect.any(String),
          message: 'New post created',
        }),
        expect.objectContaining({
          priority: 8,
          delay: 1000,
        }),
      );
    });

    it('should queue analytics task', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
        tags: ['test', 'analytics'],
      });

      postRepository.save.mockResolvedValue(mockPost);
      postMapper.toDto.mockReturnValue({} as any);

      await useCase.execute(createPostDto);

      expect(analyticsQueue.add).toHaveBeenCalledWith(
        'track_post_creation',
        expect.objectContaining({
          eventType: 'post_view',
          userId: 'user-id',
          entityId: expect.any(String),
          properties: expect.objectContaining({
            contentLength: expect.any(Number),
            mediaCount: 0,
            tagCount: 1,
            visibility: PostVisibility.PUBLIC,
            source: 'web',
          }),
        }),
        expect.objectContaining({
          priority: 3,
          delay: 5000,
        }),
      );
    });

    it('should throw error when userId is not provided', async () => {
      const createPostDto = new CreatePostDto({
        content: 'Test post content',
        visibility: PostVisibility.PUBLIC,
      });

      await expect(useCase.execute(createPostDto)).rejects.toThrow(
        'User ID is required',
      );
    });

    it('should throw error when content is invalid', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: '',
        visibility: PostVisibility.PUBLIC,
      });

      await expect(useCase.execute(createPostDto)).rejects.toThrow();
    });

    it('should throw error when media attachment is invalid', async () => {
      const createPostDto = new CreatePostDto({
        userId: 'user-id',
        content: 'Test post with invalid media',
        visibility: PostVisibility.PUBLIC,
        media: [
          {
            url: 'invalid-url',
            type: MediaType.IMAGE,
            size: -1,
            mimeType: 'image/jpeg',
          },
        ],
      });

      await expect(useCase.execute(createPostDto)).rejects.toThrow();
    });
  });
});
