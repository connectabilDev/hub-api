import { Injectable, Inject } from '@nestjs/common';
import { Organization } from '../../../domain/entities/organization.entity';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { CreateOrganizationDto } from '../../dtos/create-organization.dto';
import { OrganizationAlreadyExistsError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import { SchemaManagerService } from '../../../../shared/infrastructure/database/schema-manager.service';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
    private readonly schemaManager: SchemaManagerService,
  ) {}

  async execute(dto: CreateOrganizationDto): Promise<Organization> {
    const logtoOrg = await this.logtoClient.organizations.create({
      name: dto.name,
      description: dto.description,
    });

    const existingOrg = await this.organizationRepository.existsById(
      logtoOrg.id,
    );
    if (existingOrg) {
      throw new OrganizationAlreadyExistsError(logtoOrg.id);
    }

    const organization = Organization.create(
      logtoOrg.id,
      dto.name,
      dto.description,
    );

    await this.organizationRepository.save(organization);

    try {
      await this.schemaManager.provisionSchema(organization);

      if (dto.ownerId) {
        await this.logtoClient.organizations.addUsers(logtoOrg.id, [
          dto.ownerId,
        ]);
        await this.logtoClient.organizations.assignUserRoles(
          logtoOrg.id,
          dto.ownerId,
          ['owner'],
        );
      }

      organization.markAsProvisioned();
      await this.organizationRepository.update(organization);

      return organization;
    } catch (error) {
      try {
        await this.logtoClient.organizations.delete(logtoOrg.id);
      } catch {
        // Ignore deletion errors during cleanup
      }
      try {
        await this.organizationRepository.delete(organization.getId());
      } catch {
        // Ignore deletion errors during cleanup
      }
      throw error;
    }
  }
}
