import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ModuleAccessGuard } from '../../../auth/infrastructure/guards/module-access.guard';
import { ModuleActionGuard } from '../../../auth/infrastructure/guards/module-action.guard';
import { RequireModule } from '../../../auth/infrastructure/decorators/module.decorator';
import { RequireModuleAction } from '../../../auth/infrastructure/decorators/module-action.decorator';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { User } from '../../../auth/domain/entities/user.entity';

@ApiTags('Community')
@ApiBearerAuth()
@Controller('community')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('community')
export class CommunityController {
  @Get('posts')
  @ApiOperation({ summary: 'View community posts' })
  getPosts(@CurrentUser() user: User, @Query('page') page: number = 1) {
    return {
      message: 'Community posts',
      user: user.email,
      page,
      posts: [
        {
          id: 1,
          title: 'Welcome to the community!',
          content: 'This is your first community post',
          author: 'System',
          createdAt: new Date(),
        },
      ],
    };
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @UseGuards(ModuleActionGuard)
  @RequireModuleAction('community', 'post')
  createPost(
    @CurrentUser() user: User,
    @Body() body: { title: string; content: string },
  ) {
    return {
      message: 'Post created successfully',
      post: {
        id: Date.now(),
        ...body,
        author: user.email,
        createdAt: new Date(),
      },
    };
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete own post' })
  @UseGuards(ModuleActionGuard)
  @RequireModuleAction('community', 'manage')
  deletePost(@CurrentUser() user: User, @Param('id') id: string) {
    return {
      message: `Post ${id} deleted by ${user.email}`,
    };
  }

  @Post('posts/:id/moderate')
  @ApiOperation({ summary: 'Moderate a post (moderators only)' })
  @UseGuards(ModuleActionGuard)
  @RequireModuleAction('community', 'moderate')
  moderatePost(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'flag'; reason?: string },
  ) {
    return {
      message: `Post ${id} moderated`,
      moderatedBy: user.email,
      action: body.action,
      reason: body.reason,
    };
  }

  @Get('access-check')
  @ApiOperation({ summary: 'Check user access levels in community module' })
  checkAccess(@CurrentUser() user: User) {
    return {
      module: 'community',
      user: user.email,
      permissions: {
        canView: user.hasScope('community:view'),
        canPost: user.hasScope('community:post'),
        canManage: user.hasScope('community:manage'),
        canModerate: user.hasScope('community:moderate'),
        isAdmin: user.hasScope('community:admin'),
      },
      userScopes: user.scopes.filter((s) => s.startsWith('community:')),
    };
  }
}
