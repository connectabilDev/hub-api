import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../../../auth/infrastructure/guards/module-access.guard';
import { RequireModule } from '../../../auth/infrastructure/decorators/module.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { User } from '../../../auth/domain/entities/user.entity';
import { OrganizationContextInterceptor } from '../../../shared/infrastructure/interceptors/organization-context.interceptor';
import { CreatePostUseCase } from '../../application/use-cases/create-post/create-post.use-case';
import { GetFeedPostsUseCase } from '../../application/use-cases/get-feed-posts/get-feed-posts.use-case';
import { LikePostUseCase } from '../../application/use-cases/like-post/like-post.use-case';
import { CreatePostDto } from '../../application/dtos/create-post.dto';
import { PostDto } from '../../application/dtos/post.dto';
import { GetFeedPostsDto } from '../../application/use-cases/get-feed-posts/get-feed-posts.dto';
import { LikePostDto } from '../../application/use-cases/like-post/like-post.dto';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('api/v1/feed')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@UseInterceptors(OrganizationContextInterceptor)
@RequireModule('community')
export class FeedController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly getFeedPostsUseCase: GetFeedPostsUseCase,
    private readonly likePostUseCase: LikePostUseCase,
  ) {}

  @Post('posts')
  @ApiOperation({
    summary: 'Create a new post',
    description:
      'Creates a new post in the community feed with optional media attachments and tags',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async createPost(
    @CurrentUser() user: User,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    createPostDto.userId = user.id;
    return await this.createPostUseCase.execute(createPostDto);
  }

  @Get('posts')
  @ApiOperation({
    summary: 'Get feed posts',
    description: 'Retrieves paginated posts from the community feed',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of posts per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feed posts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PostDto' },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  async getFeedPosts(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{
    data: PostDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const clampedLimit = Math.min(Math.max(limit, 1), 50);
    const clampedPage = Math.max(page, 1);

    const getFeedDto = new GetFeedPostsDto({
      userId: user.id,
      page: clampedPage,
      limit: clampedLimit,
    });

    const result = await this.getFeedPostsUseCase.execute(getFeedDto);

    return {
      data: result.data,
      meta: {
        page: clampedPage,
        limit: clampedLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / clampedLimit),
      },
    };
  }

  @Get('posts/:id')
  @ApiOperation({
    summary: 'Get post details',
    description: 'Retrieves detailed information about a specific post',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Post ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post details retrieved successfully',
    type: PostDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async getPostDetails(
    @CurrentUser() user: User,
    @Param('id') postId: string,
  ): Promise<PostDto> {
    const getFeedDto = new GetFeedPostsDto({
      userId: user.id,
      page: 1,
      limit: 1,
      postId,
    });

    const result = await this.getFeedPostsUseCase.execute(getFeedDto);

    if (result.data.length === 0) {
      throw new Error('Post not found');
    }

    return result.data[0];
  }

  @Post('posts/:id/like')
  @ApiOperation({
    summary: 'Like or unlike a post',
    description:
      'Toggles like status for a post. If already liked, removes like; otherwise adds like',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Post ID to like/unlike',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post like status updated successfully',
    schema: {
      type: 'object',
      properties: {
        liked: { type: 'boolean', example: true },
        likesCount: { type: 'number', example: 42 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  async toggleLike(
    @CurrentUser() user: User,
    @Param('id') postId: string,
  ): Promise<{
    liked: boolean;
    likesCount: number;
  }> {
    const likePostDto = new LikePostDto({
      postId,
      userId: user.id,
    });

    const result = await this.likePostUseCase.execute(likePostDto);

    return {
      liked: result.isLiked,
      likesCount: result.likesCount,
    };
  }

  @Delete('posts/:id')
  @ApiOperation({
    summary: 'Delete a post',
    description: 'Deletes a post (only post author can delete their own posts)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Post ID to delete',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User not authorized to delete this post',
  })
  async deletePost(
    @CurrentUser() user: User,
    @Param('id') postId: string,
  ): Promise<void> {
    const getFeedDto = new GetFeedPostsDto({
      userId: user.id,
      page: 1,
      limit: 1,
      postId,
    });

    const result = await this.getFeedPostsUseCase.execute(getFeedDto);

    if (result.data.length === 0) {
      throw new Error('Post not found');
    }

    const post = result.data[0];
    if (post.userId !== user.id) {
      throw new Error('User not authorized to delete this post');
    }

    this.deletePostById(postId);
  }

  private deletePostById(_postId: string): void {
    throw new Error('Delete post functionality not implemented yet');
  }
}
