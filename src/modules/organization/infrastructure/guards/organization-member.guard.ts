import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { LogtoManagementClient } from '../../../shared/infrastructure/clients/logto-management.client';

@Injectable()
export class OrganizationMemberGuard implements CanActivate {
  constructor(private readonly logtoClient: LogtoManagementClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const userId = this.extractUserId(request);
    const organizationId = this.extractOrganizationId(request);

    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    if (!organizationId) {
      throw new UnauthorizedException('Organization ID not found in request');
    }

    try {
      const userOrganizations =
        await this.logtoClient.organizations.getUserOrganizations(userId);

      const isMember = userOrganizations.some(
        (org) => org.id === organizationId,
      );

      if (!isMember) {
        throw new ForbiddenException(
          `User ${userId} is not a member of organization ${organizationId}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Failed to verify organization membership',
      );
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
