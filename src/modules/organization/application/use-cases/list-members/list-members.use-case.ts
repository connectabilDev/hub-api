import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import {
  ListMembersDto,
  ListMembersResponseDto,
} from '../../dtos/list-members.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async execute(
    organizationId: string,
    dto: ListMembersDto,
  ): Promise<ListMembersResponseDto> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    try {
      const users = await this.logtoClient.organizations.getUsers(
        organizationId,
        page,
        pageSize,
      );

      const members = users.map((user) => ({
        id: user.id,
        username: user.username,
        primaryEmail: user.primaryEmail,
        primaryPhone: user.primaryPhone,
        name: user.name,
        avatar: user.avatar,
      }));

      return {
        members,
        pagination: {
          page,
          pageSize,
          total: users.length,
          hasNext: users.length === pageSize,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to list members: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
