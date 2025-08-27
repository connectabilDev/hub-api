import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { LogtoManagementClient } from '../../../shared/infrastructure/clients/logto-management.client';

export const ORGANIZATION_ROLES_KEY = 'organization_roles';
export const RequireOrganizationRoles = (...roles: string[]) =>
  SetMetadata(ORGANIZATION_ROLES_KEY, roles);

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ORGANIZATION_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const userId = this.extractUserId(request);
    const organizationId = this.extractOrganizationId(request);

    if (!userId || !organizationId) {
      throw new ForbiddenException('User ID or Organization ID not found');
    }

    try {
      const userRoles = await this.getUserOrganizationRoles(
        userId,
        organizationId,
      );

      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `User ${userId} does not have required roles [${requiredRoles.join(', ')}] in organization ${organizationId}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        'Failed to verify user roles in organization',
      );
    }
  }

  private async getUserOrganizationRoles(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    try {
      const response = await this.logtoClient.users.get(userId);
      const userOrgs = response.organizationRoles || [];

      const orgRoles = userOrgs
        .filter((role: any) => role.organizationId === organizationId)
        .map((role: any) => role.name);

      return orgRoles;
    } catch (error) {
      console.error('Failed to get user organization roles:', error);
      return [];
    }
  }

  private extractUserId(request: Request): string | null {
    const user = (request as any).user;
    return user?.sub || user?.id || null;
  }

  private extractOrganizationId(request: Request): string | null {
    return (
      request.organization?.organizationId ||
      request.params.organizationId ||
      (request.headers['x-organization-id'] as string) ||
      null
    );
  }
}
