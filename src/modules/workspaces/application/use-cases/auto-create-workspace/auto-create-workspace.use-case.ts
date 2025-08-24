import { Injectable, Logger } from '@nestjs/common';
import { CreateWorkspaceUseCase } from '../create-workspace/create-workspace.use-case';
import { CreateWorkspaceDto } from '../create-workspace/create-workspace.dto';
import { WorkspaceType } from '../../../domain/entities/workspace.entity';
import { UserRole } from '../../../../auth/domain/entities/user.entity';

@Injectable()
export class AutoCreateWorkspaceUseCase {
  private readonly logger = new Logger(AutoCreateWorkspaceUseCase.name);

  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
  ) {}

  async executeForRoleAssignment(
    userId: string,
    userName: string,
    role: UserRole,
    organizationId?: string,
  ): Promise<void> {
    const workspaceType = this.mapRoleToWorkspaceType(role);

    if (!workspaceType) {
      this.logger.log(`Role ${role} does not require a workspace`);
      return;
    }

    if (!organizationId) {
      this.logger.warn(`No organization ID provided for workspace creation`);
      return;
    }

    try {
      const dto = new CreateWorkspaceDto({
        organizationId,
        ownerId: userId,
        ownerName: userName,
        type: workspaceType,
      });

      await this.createWorkspaceUseCase.execute(dto);

      this.logger.log(
        `Auto-created ${workspaceType} workspace for user ${userId} with role ${role}`,
      );
    } catch (error) {
      if (error.name === 'WorkspaceAlreadyExistsError') {
        this.logger.log(
          `Workspace already exists for user ${userId} with type ${workspaceType}`,
        );
      } else {
        this.logger.error(
          `Failed to auto-create workspace for user ${userId}`,
          error,
        );
        throw error;
      }
    }
  }

  private mapRoleToWorkspaceType(role: UserRole): WorkspaceType | null {
    switch (role) {
      case UserRole.PROFESSOR:
        return WorkspaceType.PROFESSOR;
      case UserRole.MENTOR:
        return WorkspaceType.MENTOR;
      case UserRole.EMPLOYER:
        return WorkspaceType.EMPLOYER;
      default:
        return null;
    }
  }
}
