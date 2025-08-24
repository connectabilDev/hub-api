import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (organizationRole !== 'owner') {
      throw new ForbiddenException(
        'Only workspace owners can perform this action',
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
