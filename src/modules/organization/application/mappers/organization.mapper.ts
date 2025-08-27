import { Injectable } from '@nestjs/common';
import { Organization } from '../../domain/entities/organization.entity';
import { OrganizationResponseDto } from '../dtos/organization-response.dto';

@Injectable()
export class OrganizationMapper {
  toDto(entity: Organization): OrganizationResponseDto {
    return {
      id: entity.getId(),
      name: entity.getName(),
      description: entity.getDescription(),
      schemaName: entity.getSchemaName(),
      status: entity.getStatus(),
      createdAt: entity.getCreatedAt() || new Date(),
      provisionedAt: entity.getProvisionedAt(),
    };
  }

  toDtoArray(entities: Organization[]): OrganizationResponseDto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}
