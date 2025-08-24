import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  roles: string[];
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}
