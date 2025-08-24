export class CreateUserDto {
  email: string;
  name?: string;
  externalId?: string;
  username?: string;
  avatar?: string;
  phone?: string;
}

export class CreateUserResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
