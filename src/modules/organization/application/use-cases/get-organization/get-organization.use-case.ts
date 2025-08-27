import { Injectable, Inject } from '@nestjs/common';
import { Organization } from '../../../domain/entities/organization.entity';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(organizationId: string): Promise<Organization> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    return organization;
  }

  async executeBySchemaName(schemaName: string): Promise<Organization> {
    const organization =
      await this.organizationRepository.findBySchemaName(schemaName);

    if (!organization) {
      throw new OrganizationNotFoundError(`Schema: ${schemaName}`);
    }

    return organization;
  }

  async getAll(): Promise<Organization[]> {
    return this.organizationRepository.findAll();
  }
}
