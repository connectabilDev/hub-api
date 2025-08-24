import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceType } from '../../domain/entities/workspace.entity';

export class CreateWorkspaceRequestDto {
  @ApiProperty({
    description: 'The organization ID for the workspace',
    example: 'org_123abc',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'The name of the workspace',
    example: "Professor Smith's Teaching Team",
  })
  @IsString()
  name: string;

  @ApiProperty({
    enum: WorkspaceType,
    description: 'The type of workspace',
    example: WorkspaceType.PROFESSOR,
  })
  @IsEnum(WorkspaceType)
  type: WorkspaceType;

  @ApiProperty({
    description: 'Optional description of the workspace',
    example: 'Workspace for managing teaching assistants and course content',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
