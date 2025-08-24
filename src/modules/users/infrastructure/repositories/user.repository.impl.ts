import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';
import {
  Database,
  User,
  NewUser,
  UserUpdate,
} from '../../../shared/infrastructure/database/database.types';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

@Injectable()
export class UserRepositoryImpl
  extends BaseRepository
  implements UserRepositoryInterface
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    db: Kysely<Database>,
  ) {
    super(db);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return user ? this.mapToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    return user ? this.mapToDomain(user) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const newUser: NewUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };

    const savedUser = await this.db
      .insertInto('users')
      .values(newUser)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(savedUser);
  }

  async update(
    id: string,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const updateData: UserUpdate = {
      ...(userData.name && { name: userData.name }),
      updated_at: this.now(),
    };

    const updatedUser = await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return updatedUser ? this.mapToDomain(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<UserEntity[]> {
    const query = this.db
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'desc');

    const users = await this.buildPaginationQuery(query, page, limit).execute();

    return users.map((user: User) => this.mapToDomain(user));
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.exists('users', 'email', email);
  }

  private mapToDomain(user: User): UserEntity {
    return new UserEntity(
      user.id,
      user.email,
      user.name,
      user.created_at,
      user.updated_at,
    );
  }
}
