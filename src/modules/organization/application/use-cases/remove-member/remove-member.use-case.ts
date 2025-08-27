import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { RemoveMemberDto } from '../../dtos/remove-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async execute(organizationId: string, dto: RemoveMemberDto): Promise<void> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (!organization.isActive()) {
      throw new BadRequestException(
        'Cannot remove members from inactive organization',
      );
    }

    try {
      await this.logtoClient.organizations.removeUser(
        organizationId,
        dto.userId,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to remove member: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
