import {
  IsEmail,
  IsOptional,
  IsArray,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Role IDs to assign to the invited user',
    type: [String],
    example: ['admin', 'member'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @ApiPropertyOptional({
    description: 'Custom message to include in the invitation',
    example: 'Welcome to our organization!',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class InviteMemberResponseDto {
  id: string;
  invitee: string;
  organizationId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  organizationRoles?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}
