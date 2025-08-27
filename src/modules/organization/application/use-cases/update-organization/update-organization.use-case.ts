import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { UpdateOrganizationDto } from '../../dtos/update-organization.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import { Organization } from '../../../domain/entities/organization.entity';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async execute(
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const hasName = dto.name !== undefined && dto.name.trim().length > 0;
    const hasDescription = dto.description !== undefined;

    if (!hasName && !hasDescription) {
      throw new BadRequestException(
        'At least one field must be provided for update',
      );
    }

    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const updateData: { name?: string; description?: string } = {};

    if (hasName) {
      updateData.name = dto.name!.trim();
    }

    if (hasDescription) {
      updateData.description = dto.description!.trim();
    }

    try {
      await this.logtoClient.organizations.update(organizationId, updateData);

      const updatedOrganization = Organization.reconstitute(
        organization.getId(),
        organization.getSchemaName(),
        updateData.name || organization.getName(),
        updateData.description !== undefined
          ? updateData.description
          : organization.getDescription(),
        organization.getStatus(),
        organization.getCreatedAt()!,
        organization.getProvisionedAt(),
      );

      return await this.organizationRepository.update(updatedOrganization);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to update organization: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
