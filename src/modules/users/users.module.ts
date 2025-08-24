import { Module } from '@nestjs/common';
import { UserController } from './infrastructure/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
