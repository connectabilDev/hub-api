import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { AddMemberDto } from '../../dtos/add-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';

@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async execute(organizationId: string, dto: AddMemberDto): Promise<void> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (!organization.isActive()) {
      throw new BadRequestException(
        'Cannot add members to inactive organization',
      );
    }

    try {
      await this.logtoClient.organizations.addUsers(organizationId, [
        dto.userId,
      ]);

      if (dto.role) {
        await this.logtoClient.organizations.assignUserRoles(
          organizationId,
          dto.userId,
          [dto.role],
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to add member: ${error.message}`);
      }
      throw error;
    }
  }
}
