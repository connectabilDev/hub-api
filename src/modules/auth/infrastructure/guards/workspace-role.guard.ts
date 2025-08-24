import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../domain/entities/user.entity';
import { WorkspaceRole } from '../../../workspaces/domain/entities/workspace.entity';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';
export const RequireWorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const workspaceId = this.extractWorkspaceId(request);
    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID not provided');
    }

    const organizationRole = user.getOrganizationRole(workspaceId);

    if (!organizationRole) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const hasRequiredRole = requiredRoles.some(
      (role) => role === (organizationRole as WorkspaceRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Required workspace role(s): ${requiredRoles.join(', ')}. Your role: ${organizationRole}`,
      );
    }

    return true;
  }

  private extractWorkspaceId(request: Request): string | undefined {
    return (
      request.params.workspaceId ||
      request.params.organizationId ||
      request.body?.workspaceId ||
      request.body?.organizationId ||
      (request.query.workspaceId as string) ||
      (request.query.organizationId as string)
    );
  }
}
