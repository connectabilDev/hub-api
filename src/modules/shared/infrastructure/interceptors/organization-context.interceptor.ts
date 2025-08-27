import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { OrganizationAwareRepository } from '../database/organization-aware.repository';
import { OrganizationContext } from '../../../organization/infrastructure/middleware/organization-context.middleware';
import { POST_REPOSITORY } from '../../../community/domain/repositories/post.repository.interface';

@Injectable()
export class OrganizationContextInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const organizationContext = request.organization;

    if (organizationContext) {
      this.setOrganizationContextOnRepositories(organizationContext);
    }

    return next.handle();
  }

  private setOrganizationContextOnRepositories(
    organizationContext: OrganizationContext,
  ): void {
    const repositories = [POST_REPOSITORY];

    repositories.forEach((repositoryToken) => {
      try {
        const repository = this.moduleRef.get(repositoryToken, {
          strict: false,
        });

        if (repository && typeof repository.setOrganizationDb === 'function') {
          (repository as OrganizationAwareRepository).setOrganizationDb(
            organizationContext.organizationDb,
          );
        }
      } catch {
        // Repository might not be available in current context, ignore
      }
    });
  }
}
