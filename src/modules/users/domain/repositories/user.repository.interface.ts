import { UserEntity } from '../entities/user.entity';

export interface UserRepositoryInterface {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
  findAll(page?: number, limit?: number): Promise<UserEntity[]>;
  existsByEmail(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
