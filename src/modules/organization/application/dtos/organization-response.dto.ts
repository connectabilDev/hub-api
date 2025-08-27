import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus } from '../../domain/entities/organization.entity';

export class OrganizationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the organization',
    example: 'org_123456',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the organization',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the organization',
    example: 'Leading technology company',
  })
  description?: string;

  @ApiProperty({
    description: 'Database schema name',
    example: 'org_123456',
  })
  schemaName: string;

  @ApiProperty({
    description: 'Current status of the organization',
    enum: OrganizationStatus,
    example: OrganizationStatus.ACTIVE,
  })
  status: OrganizationStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Provisioning completion timestamp',
    example: '2024-01-01T00:01:00Z',
  })
  provisionedAt?: Date;
}
