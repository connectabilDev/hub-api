import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add to the organization',
    example: 'user_123456',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Role to assign to the user',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole = OrganizationRole.MEMBER;
}
