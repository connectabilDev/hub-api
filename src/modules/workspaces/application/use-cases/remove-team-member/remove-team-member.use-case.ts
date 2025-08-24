import { Injectable, Logger, Inject } from '@nestjs/common';
import { RemoveTeamMemberDto } from './remove-team-member.dto';
import type { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository.interface';
import { WORKSPACE_REPOSITORY } from '../../../domain/repositories/workspace.repository.interface';
import type { IWorkspaceMemberRepository } from '../../../domain/repositories/workspace-member.repository.interface';
import { WORKSPACE_MEMBER_REPOSITORY } from '../../../domain/repositories/workspace-member.repository.interface';
import {
  WorkspaceNotFoundError,
  WorkspaceMemberNotFoundError,
  InsufficientWorkspacePermissionsError,
} from '../../../domain/errors/workspace.errors';

@Injectable()
export class RemoveTeamMemberUseCase {
  private readonly logger = new Logger(RemoveTeamMemberUseCase.name);

  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject(WORKSPACE_MEMBER_REPOSITORY)
    private readonly workspaceMemberRepository: IWorkspaceMemberRepository,
  ) {}

  async execute(dto: RemoveTeamMemberDto): Promise<void> {
    this.logger.log(
      `Removing member ${dto.memberId} from workspace ${dto.workspaceId}`,
    );

    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace) {
      throw new WorkspaceNotFoundError(dto.workspaceId);
    }

    const removerMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        dto.workspaceId,
        dto.removedBy,
      );

    if (!removerMember || !removerMember.canRemoveMembers()) {
      throw new InsufficientWorkspacePermissionsError('remove team members');
    }

    const memberToRemove =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        dto.workspaceId,
        dto.memberId,
      );

    if (!memberToRemove) {
      throw new WorkspaceMemberNotFoundError(dto.memberId, dto.workspaceId);
    }

    if (memberToRemove.userId === workspace.ownerId) {
      throw new InsufficientWorkspacePermissionsError(
        'remove the workspace owner',
      );
    }

    await this.workspaceMemberRepository.delete(dto.workspaceId, dto.memberId);

    this.logger.log(
      `Successfully removed member ${dto.memberId} from workspace ${workspace.name}`,
    );
  }
}
