import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the workspace',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID this workspace belongs to',
    example: 'org_123abc',
  })
  organizationId: string;

  @ApiProperty({
    description: 'User ID of the workspace owner',
    example: 'user_123',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Name of the workspace',
    example: "Professor Smith's Teaching Team",
  })
  name: string;

  @ApiProperty({
    description: 'Type of workspace',
    example: 'PROFESSOR',
  })
  type: string;

  @ApiProperty({
    description: 'Optional description of the workspace',
    example: 'Workspace for managing teaching assistants and course content',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
