import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.interface';
import { SchemaManagerService } from '../../../shared/infrastructure/database/schema-manager.service';

export interface OrganizationContext {
  organizationId: string;
  schemaName: string;
  organizationDb: any;
}

declare module 'express-serve-static-core' {
  interface Request {
    organization?: OrganizationContext;
  }
}

@Injectable()
export class OrganizationContextMiddleware implements NestMiddleware {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly schemaManagerService: SchemaManagerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = this.extractOrganizationId(req);

      if (!organizationId) {
        return next();
      }

      const organization =
        await this.organizationRepository.findById(organizationId);

      if (!organization) {
        throw new NotFoundException(`Organization ${organizationId} not found`);
      }

      if (!organization.isActive()) {
        throw new BadRequestException(
          `Organization ${organizationId} is not active`,
        );
      }

      const schemaName = organization.getSchemaName();
      const organizationDb =
        this.schemaManagerService.getDbForSchema(schemaName);

      req.organization = {
        organizationId,
        schemaName,
        organizationDb,
      };

      next();
    } catch (error) {
      next(error);
    }
  }

  private extractOrganizationId(req: Request): string | null {
    const orgIdFromHeader = req.headers?.['x-organization-id'] as string;
    const orgIdFromParam = req.params?.organizationId;
    const orgIdFromQuery = req.query?.organizationId as string;

    const header =
      typeof orgIdFromHeader === 'string' && orgIdFromHeader.trim()
        ? orgIdFromHeader
        : null;
    const param =
      typeof orgIdFromParam === 'string' && orgIdFromParam.trim()
        ? orgIdFromParam
        : null;
    const query =
      typeof orgIdFromQuery === 'string' && orgIdFromQuery.trim()
        ? orgIdFromQuery
        : null;

    return header || param || query || null;
  }
}
