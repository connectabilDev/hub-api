import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveMemberDto {
  @ApiProperty({
    description: 'User ID to remove from the organization',
    example: 'user_123456',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
