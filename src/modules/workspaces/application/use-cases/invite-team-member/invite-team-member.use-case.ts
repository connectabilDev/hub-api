import { Injectable, Logger, Inject } from '@nestjs/common';
import { InviteTeamMemberDto } from './invite-team-member.dto';
import { WorkspaceMember } from '../../../domain/entities/workspace-member.entity';
import type { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository.interface';
import { WORKSPACE_REPOSITORY } from '../../../domain/repositories/workspace.repository.interface';
import type { IWorkspaceMemberRepository } from '../../../domain/repositories/workspace-member.repository.interface';
import { WORKSPACE_MEMBER_REPOSITORY } from '../../../domain/repositories/workspace-member.repository.interface';
import {
  WorkspaceNotFoundError,
  InvalidWorkspaceRoleError,
  WorkspaceMemberAlreadyExistsError,
  InsufficientWorkspacePermissionsError,
} from '../../../domain/errors/workspace.errors';

@Injectable()
export class InviteTeamMemberUseCase {
  private readonly logger = new Logger(InviteTeamMemberUseCase.name);

  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject(WORKSPACE_MEMBER_REPOSITORY)
    private readonly workspaceMemberRepository: IWorkspaceMemberRepository,
  ) {}

  async execute(dto: InviteTeamMemberDto): Promise<WorkspaceMember> {
    this.logger.log(
      `Inviting user ${dto.inviteeEmail} to workspace ${dto.workspaceId} with role ${dto.role}`,
    );

    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace) {
      throw new WorkspaceNotFoundError(dto.workspaceId);
    }

    const inviterMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        dto.workspaceId,
        dto.inviterId,
      );

    if (!inviterMember || !inviterMember.canInviteMembers()) {
      throw new InsufficientWorkspacePermissionsError('invite team members');
    }

    if (!workspace.isRoleAllowed(dto.role)) {
      throw new InvalidWorkspaceRoleError(dto.role, workspace.type);
    }

    const existingMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        dto.workspaceId,
        dto.inviteeId,
      );

    if (existingMember) {
      throw new WorkspaceMemberAlreadyExistsError(
        dto.inviteeId,
        dto.workspaceId,
      );
    }

    const newMember = WorkspaceMember.create({
      workspaceId: dto.workspaceId,
      userId: dto.inviteeId,
      role: dto.role,
      invitedBy: dto.inviterId,
      invitedAt: new Date(),
    });

    const savedMember = await this.workspaceMemberRepository.create(newMember);

    this.sendInvitationEmail(dto.inviteeEmail, workspace.name, dto.role);

    this.logger.log(
      `Successfully invited ${dto.inviteeEmail} to workspace ${workspace.name}`,
    );

    return savedMember;
  }

  private sendInvitationEmail(
    email: string,
    workspaceName: string,
    _role: string,
  ): void {
    this.logger.log(
      `Sending invitation email to ${email} for workspace ${workspaceName}`,
    );
  }
}
