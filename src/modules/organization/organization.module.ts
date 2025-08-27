import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CreateOrganizationUseCase } from './application/use-cases/create-organization/create-organization.use-case';
import { GetOrganizationUseCase } from './application/use-cases/get-organization/get-organization.use-case';
import { AddMemberUseCase } from './application/use-cases/add-member/add-member.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member/remove-member.use-case';
import { ListOrganizationsUseCase } from './application/use-cases/list-organizations/list-organizations.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization/update-organization.use-case';
import { InviteMemberUseCase } from './application/use-cases/invite-member/invite-member.use-case';
import { ListMembersUseCase } from './application/use-cases/list-members/list-members.use-case';
import { OrganizationMapper } from './application/mappers/organization.mapper';

import { OrganizationRepositoryImpl } from './infrastructure/repositories/organization.repository';
import { OrganizationController } from './infrastructure/controllers/organization.controller';
import { OrganizationContextMiddleware } from './infrastructure/middleware/organization-context.middleware';
import { OrganizationMemberGuard } from './infrastructure/guards/organization-member.guard';
import { OrganizationRoleGuard } from './infrastructure/guards/organization-role.guard';

import { LogtoManagementClient } from '../shared/infrastructure/clients/logto-management.client';
import { SchemaManagerService } from '../shared/infrastructure/database/schema-manager.service';
import { DatabaseModule } from '../shared/infrastructure/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [OrganizationController],
  providers: [
    CreateOrganizationUseCase,
    GetOrganizationUseCase,
    AddMemberUseCase,
    RemoveMemberUseCase,
    ListOrganizationsUseCase,
    UpdateOrganizationUseCase,
    InviteMemberUseCase,
    ListMembersUseCase,
    OrganizationMapper,
    {
      provide: 'ORGANIZATION_REPOSITORY',
      useClass: OrganizationRepositoryImpl,
    },
    OrganizationRepositoryImpl,
    OrganizationMemberGuard,
    OrganizationRoleGuard,
    LogtoManagementClient,
    SchemaManagerService,
  ],
  exports: [
    'ORGANIZATION_REPOSITORY',
    OrganizationRepositoryImpl,
    SchemaManagerService,
    LogtoManagementClient,
    OrganizationMemberGuard,
    OrganizationRoleGuard,
  ],
})
export class OrganizationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OrganizationContextMiddleware)
      .forRoutes(
        { path: 'organizations/:organizationId*', method: RequestMethod.ALL },
        { path: '*/organizations/:organizationId*', method: RequestMethod.ALL },
      );
  }
}
