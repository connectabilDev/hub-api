import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import {
  InviteMemberDto,
  InviteMemberResponseDto,
} from '../../dtos/invite-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
    private readonly logtoClient: LogtoManagementClient,
  ) {}

  async execute(
    organizationId: string,
    dto: InviteMemberDto,
  ): Promise<InviteMemberResponseDto> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }

    if (!organization.isActive()) {
      throw new BadRequestException(
        'Cannot invite members to inactive organization',
      );
    }

    try {
      const invitation = await this.logtoClient.organizations.createInvitation(
        organizationId,
        dto.email,
        dto.roleIds,
        dto.message,
      );

      return {
        id: invitation.id,
        invitee: invitation.invitee,
        organizationId: invitation.organizationId,
        status: invitation.status,
        createdAt: new Date(invitation.createdAt),
        updatedAt: new Date(invitation.updatedAt),
        expiresAt: new Date(invitation.expiresAt),
        organizationRoles: invitation.organizationRoles,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to create invitation: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
