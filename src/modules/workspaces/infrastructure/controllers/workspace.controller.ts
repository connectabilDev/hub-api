import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { WorkspaceOwnerGuard } from '../../../auth/infrastructure/guards/workspace-owner.guard';
import { WorkspaceMemberGuard } from '../../../auth/infrastructure/guards/workspace-member.guard';
import { CreateWorkspaceRequestDto } from '../dtos/create-workspace.request.dto';
import { InviteTeamMemberRequestDto } from '../dtos/invite-team-member.request.dto';
import { WorkspaceResponseDto } from '../dtos/workspace.response.dto';
import { WorkspaceMemberResponseDto } from '../dtos/workspace-member.response.dto';

@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/workspaces')
export class WorkspaceController {
  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workspace created successfully',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Workspace already exists for this user and type',
  })
  createWorkspace(
    @Request() req: any,
    @Body() dto: CreateWorkspaceRequestDto,
  ): WorkspaceResponseDto {
    return {
      id: 'workspace-id',
      organizationId: 'org-id',
      ownerId: req.user.id,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workspace details retrieved',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workspace not found',
  })
  getWorkspace(
    @Param('workspaceId') workspaceId: string,
  ): WorkspaceResponseDto {
    return {
      id: workspaceId,
      organizationId: 'org-id',
      ownerId: 'owner-id',
      name: 'Teaching Team',
      type: 'professor_workspace',
      description: 'Professor workspace',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'List workspace members' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workspace members listed',
    type: [WorkspaceMemberResponseDto],
  })
  listMembers(
    @Param('workspaceId') _workspaceId: string,
  ): WorkspaceMemberResponseDto[] {
    return [];
  }

  @Post(':workspaceId/members/invite')
  @UseGuards(WorkspaceOwnerGuard)
  @ApiOperation({ summary: 'Invite a team member to workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Team member invited successfully',
    type: WorkspaceMemberResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only workspace owners can invite members',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member of this workspace',
  })
  inviteMember(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() dto: InviteTeamMemberRequestDto,
  ): WorkspaceMemberResponseDto {
    return {
      id: 'member-id',
      workspaceId,
      userId: 'invited-user-id',
      userName: dto.email,
      userEmail: dto.email,
      role: dto.role,
      invitedBy: req.user.id,
      invitedAt: new Date(),
      joinedAt: new Date(),
      isActive: true,
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'List my workspaces' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User workspaces listed',
    type: [WorkspaceResponseDto],
  })
  listMyWorkspaces(@Request() _req: any): WorkspaceResponseDto[] {
    return [];
  }

  @Delete(':workspaceId/members/:userId')
  @UseGuards(WorkspaceOwnerGuard)
  @ApiOperation({ summary: 'Remove a team member from workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Team member removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only workspace owners can remove members',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workspace or member not found',
  })
  removeTeamMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ): void {
    // TODO: Implement with RemoveTeamMemberUseCase
    console.log(
      `Removing user ${userId} from workspace ${workspaceId} by ${req.user.id}`,
    );
  }
}
