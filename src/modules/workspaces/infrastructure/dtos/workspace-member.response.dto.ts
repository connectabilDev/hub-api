import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceMemberResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the workspace member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the workspace',
    example: 'workspace_123',
  })
  workspaceId: string;

  @ApiProperty({
    description: 'ID of the user',
    example: 'user_123',
  })
  userId: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    required: false,
  })
  userName?: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john@example.com',
    required: false,
  })
  userEmail?: string;

  @ApiProperty({
    description: 'Role of the member in the workspace',
    example: 'ASSISTANT',
  })
  role: string;

  @ApiProperty({
    description: 'ID of the user who invited this member',
    example: 'user_456',
    required: false,
  })
  invitedBy?: string;

  @ApiProperty({
    description: 'Timestamp when the member was invited',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  invitedAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the member joined',
    example: '2024-01-01T00:00:00Z',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Whether the member is currently active',
    example: true,
  })
  isActive: boolean;
}
