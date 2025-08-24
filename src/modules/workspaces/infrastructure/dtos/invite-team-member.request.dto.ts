import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { WorkspaceRole } from '../../domain/entities/workspace.entity';

export class InviteTeamMemberRequestDto {
  @ApiProperty({
    description: 'The email address of the user to invite',
    example: 'assistant@university.edu',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: WorkspaceRole,
    description: 'The role to assign to the invited member',
    example: WorkspaceRole.ASSISTANT,
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
