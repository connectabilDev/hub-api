import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Logto User ID from authentication',
    example: 'logto_user_123456',
  })
  @IsString()
  @IsNotEmpty()
  logtoUserId: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  fullName: string;
}
