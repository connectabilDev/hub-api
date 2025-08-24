import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateWorkspaceDto } from './create-workspace.dto';
import {
  Workspace,
  WorkspaceType,
  WorkspaceRole,
} from '../../../domain/entities/workspace.entity';
import { WorkspaceMember } from '../../../domain/entities/workspace-member.entity';
import type { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository.interface';
import { WORKSPACE_REPOSITORY } from '../../../domain/repositories/workspace.repository.interface';
import type { IWorkspaceMemberRepository } from '../../../domain/repositories/workspace-member.repository.interface';
import { WORKSPACE_MEMBER_REPOSITORY } from '../../../domain/repositories/workspace-member.repository.interface';
import { WorkspaceAlreadyExistsError } from '../../../domain/errors/workspace.errors';
import { WORKSPACE_TEMPLATES } from '../../../../../../scripts/logto/config/organizations';

@Injectable()
export class CreateWorkspaceUseCase {
  private readonly logger = new Logger(CreateWorkspaceUseCase.name);

  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject(WORKSPACE_MEMBER_REPOSITORY)
    private readonly workspaceMemberRepository: IWorkspaceMemberRepository,
  ) {}

  async execute(dto: CreateWorkspaceDto): Promise<Workspace> {
    this.logger.log(
      `Creating workspace for user ${dto.ownerId} of type ${dto.type}`,
    );

    const existingWorkspaces = await this.workspaceRepository.findByOwnerId(
      dto.ownerId,
    );
    const hasWorkspaceOfType = existingWorkspaces.some(
      (w) => w.type === dto.type,
    );

    if (hasWorkspaceOfType) {
      throw new WorkspaceAlreadyExistsError(dto.ownerId, dto.type);
    }

    const workspaceName = this.generateWorkspaceName(dto.type, dto.ownerName);

    const workspace = Workspace.create({
      organizationId: dto.organizationId,
      ownerId: dto.ownerId,
      name: workspaceName,
      type: dto.type,
      description:
        dto.description || this.generateDescription(dto.type, dto.ownerName),
    });

    const savedWorkspace = await this.workspaceRepository.create(workspace);

    const ownerMember = WorkspaceMember.create({
      workspaceId: savedWorkspace.id,
      userId: dto.ownerId,
      role: WorkspaceRole.OWNER,
    });

    await this.workspaceMemberRepository.create(ownerMember);

    this.logger.log(`Workspace created successfully: ${savedWorkspace.id}`);

    return savedWorkspace;
  }

  private generateWorkspaceName(
    type: WorkspaceType,
    ownerName: string,
  ): string {
    switch (type) {
      case WorkspaceType.PROFESSOR:
        return WORKSPACE_TEMPLATES.PROFESSOR(ownerName);
      case WorkspaceType.MENTOR:
        return WORKSPACE_TEMPLATES.MENTOR(ownerName);
      case WorkspaceType.EMPLOYER:
        return WORKSPACE_TEMPLATES.EMPLOYER(ownerName);
      default:
        return `${ownerName}'s Workspace`;
    }
  }

  private generateDescription(type: WorkspaceType, ownerName: string): string {
    switch (type) {
      case WorkspaceType.PROFESSOR:
        return `Teaching team workspace for Professor ${ownerName}`;
      case WorkspaceType.MENTOR:
        return `Mentoring team workspace for ${ownerName}`;
      case WorkspaceType.EMPLOYER:
        return `Hiring team workspace for ${ownerName}`;
      default:
        return `Workspace for ${ownerName}`;
    }
  }
}
