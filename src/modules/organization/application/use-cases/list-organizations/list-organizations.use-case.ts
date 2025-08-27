import { Injectable, Inject } from '@nestjs/common';
import type { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import {
  ListOrganizationsDto,
  ListOrganizationsResponseDto,
} from '../../dtos/list-organizations.dto';

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject('ORGANIZATION_REPOSITORY')
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    dto: ListOrganizationsDto,
  ): Promise<ListOrganizationsResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const allOrganizations = await this.organizationRepository.findAll();

    let filteredOrganizations = allOrganizations;

    if (dto.q) {
      filteredOrganizations = allOrganizations.filter(
        (org) =>
          org.getName().toLowerCase().includes(dto.q!.toLowerCase()) ||
          (org.getDescription() &&
            org.getDescription()!.toLowerCase().includes(dto.q!.toLowerCase())),
      );
    }

    const total = filteredOrganizations.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrganizations = filteredOrganizations.slice(
      startIndex,
      endIndex,
    );

    const organizations = paginatedOrganizations.map((org) => ({
      id: org.getId(),
      name: org.getName(),
      description: org.getDescription(),
      status: org.getStatus(),
      createdAt: org.getCreatedAt()!,
      provisionedAt: org.getProvisionedAt(),
    }));

    const hasNext = endIndex < total;
    const hasPrevious = page > 1;

    return {
      organizations,
      pagination: {
        page,
        pageSize,
        total,
        hasNext,
        hasPrevious,
      },
    };
  }
}
