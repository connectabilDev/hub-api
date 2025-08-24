# Database Setup with Kysely

## Overview

This project uses Kysely as the query builder with PostgreSQL, following Clean Architecture principles. Each module has its own repository implementation that extends the base repository.

## Architecture

### Structure

```
src/modules/shared/infrastructure/database/
├── database.types.ts           # Type definitions and schema
├── database.config.ts          # Database configuration service
├── database.module.ts          # NestJS module with DI setup
├── base.repository.ts          # Base repository with common functionality
├── migrations/
│   ├── migration.interface.ts  # Migration interface
│   ├── migrator.service.ts     # Migration service
│   └── *.migration.ts          # Migration files
└── index.ts                    # Barrel exports
```

### Type Safety

The database schema is fully typed:

```typescript
// Define your database schema
export interface DatabaseSchema {
  users: UserTable;
  posts: PostTable; // Add new tables here
}

// Table definitions
export interface UserTable {
  id: Generated<string>;
  email: string;
  name: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// Helper types for CRUD operations
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
```

## Usage

### 1. Environment Setup

Copy `.env.example` to `.env` and configure your database:

```bash
cp .env.example .env
```

### 2. Run Migrations

```bash
# Run all migrations
yarn migrate

# Or explicitly run up migrations
yarn migrate:up

# Rollback last migration
yarn migrate:down
```

### 3. Creating a New Module with Repository

#### 3.1 Define Domain Entity

```typescript
// src/modules/posts/domain/entities/post.entity.ts
export class PostEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    title: string;
    content: string;
    userId: string;
  }): PostEntity {
    const now = new Date();
    return new PostEntity(
      crypto.randomUUID(),
      props.title,
      props.content,
      props.userId,
      now,
      now,
    );
  }
}
```

#### 3.2 Define Repository Interface

```typescript
// src/modules/posts/domain/repositories/post.repository.interface.ts
import { PostEntity } from '../entities/post.entity';

export interface PostRepositoryInterface {
  findById(id: string): Promise<PostEntity | null>;
  findByUserId(userId: string): Promise<PostEntity[]>;
  save(post: PostEntity): Promise<PostEntity>;
  update(id: string, post: Partial<PostEntity>): Promise<PostEntity | null>;
  delete(id: string): Promise<boolean>;
}

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');
```

#### 3.3 Implement Repository

```typescript
// src/modules/posts/infrastructure/repositories/post.repository.impl.ts
import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { PostEntity } from '../../domain/entities/post.entity';
import { PostRepositoryInterface } from '../../domain/repositories/post.repository.interface';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';
import { Database } from '../../../shared/infrastructure/database/database.types';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

@Injectable()
export class PostRepositoryImpl
  extends BaseRepository
  implements PostRepositoryInterface
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    db: Kysely<Database>,
  ) {
    super(db);
  }

  async findById(id: string): Promise<PostEntity | null> {
    const post = await this.db
      .selectFrom('posts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return post ? this.mapToDomain(post) : null;
  }

  async findByUserId(userId: string): Promise<PostEntity[]> {
    const posts = await this.db
      .selectFrom('posts')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();

    return posts.map((post) => this.mapToDomain(post));
  }

  // ... other methods

  private mapToDomain(post: any): PostEntity {
    return new PostEntity(
      post.id,
      post.title,
      post.content,
      post.user_id,
      post.created_at,
      post.updated_at,
    );
  }
}
```

### 4. Advanced Queries

The base repository provides common functionality, but you can write complex queries:

```typescript
// Complex query with joins
async findPostsWithUserInfo(limit: number = 10): Promise<any[]> {
  return this.db
    .selectFrom('posts')
    .innerJoin('users', 'users.id', 'posts.user_id')
    .select([
      'posts.id',
      'posts.title',
      'posts.content',
      'posts.created_at',
      'users.name as author_name',
      'users.email as author_email'
    ])
    .orderBy('posts.created_at', 'desc')
    .limit(limit)
    .execute()
}

// Transaction example
async createPostWithNotification(postData: any, notificationData: any): Promise<void> {
  await this.withTransaction(async (trx) => {
    const post = await trx
      .insertInto('posts')
      .values(postData)
      .returningAll()
      .executeTakeFirstOrThrow()

    await trx
      .insertInto('notifications')
      .values({
        ...notificationData,
        post_id: post.id
      })
      .execute()
  })
}
```

### 5. Adding New Tables

#### 5.1 Update Schema Types

```typescript
// src/modules/shared/infrastructure/database/database.types.ts
export interface DatabaseSchema {
  users: UserTable;
  posts: PostTable; // Add this
}

export interface PostTable {
  id: Generated<string>;
  title: string;
  content: string;
  user_id: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;
```

#### 5.2 Create Migration

```typescript
// src/modules/shared/infrastructure/database/migrations/002-create-posts-table.migration.ts
import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreatePostsTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('posts')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('title', 'varchar(255)', (col) => col.notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id').onDelete('cascade'),
      )
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('posts').execute();
  },
};
```

#### 5.3 Register Migration

```typescript
// src/cli/migrate.ts
const migrations = [
  { name: '001-create-users-table', migration: CreateUsersTableMigration },
  { name: '002-create-posts-table', migration: CreatePostsTableMigration }, // Add this
];
```

## Best Practices

1. **Type Safety**: Always update the database schema types when adding new tables
2. **Migrations**: Keep migrations small and focused on a single change
3. **Repository Pattern**: Each domain entity should have its own repository interface
4. **Transactions**: Use transactions for operations that need to be atomic
5. **Error Handling**: Let domain errors bubble up from repositories
6. **Testing**: Mock repository interfaces in unit tests
7. **Separation**: Keep database concerns in the infrastructure layer

## Testing

```typescript
// Mock repository in tests
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  // ... other methods
};

// Use in test module
const module = await Test.createTestingModule({
  providers: [
    SomeUseCase,
    {
      provide: SOME_REPOSITORY,
      useValue: mockRepository,
    },
  ],
}).compile();
```

This setup provides a solid foundation for database operations while maintaining clean architecture principles and type safety throughout the application.
