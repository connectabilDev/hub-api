export class CreateUserDto {
  email: string;
  name: string;
}

export class CreateUserResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
