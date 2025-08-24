import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import {
  CreateUserDto,
  CreateUserResponseDto,
} from '../../application/use-cases/create-user/create-user.dto';
import type { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { Inject } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get()
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const users = await this.userRepository.findAll(page, limit);
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
}
