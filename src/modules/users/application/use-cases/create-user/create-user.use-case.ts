import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { UserEntity } from '../../../domain/entities/user.entity';
import type { UserRepositoryInterface } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { CreateUserDto, CreateUserResponseDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const existingUser = await this.userRepository.existsByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = UserEntity.create({
      email: dto.email,
      name: dto.name || '',
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
