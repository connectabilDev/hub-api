import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { Database } from '../../../shared/infrastructure/database/database.types';
import { OrganizationAwareRepository } from '../../../shared/infrastructure/database/organization-aware.repository';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';
import { PostRepositoryInterface } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/entities/post.entity';
import {
  PaginationParams,
  PaginatedResult,
} from '../../domain/repositories/pagination.interface';
import { PostMapper } from '../../application/mappers/post.mapper';

@Injectable()
export class PostRepositoryImpl
  extends OrganizationAwareRepository
  implements PostRepositoryInterface
{
  constructor(
    @Inject(DATABASE_CONNECTION) db: Kysely<Database>,
    private readonly postMapper: PostMapper,
  ) {
    super(db);
  }

  async save(post: Post): Promise<Post> {
    const postData = {
      id: post.id,
      user_id: post.userId,
      content: post.content,
      visibility: post.visibility,
      media: JSON.stringify(post.media),
      tags: post.tags,
      likes_count: post.likesCount,
      comments_count: post.commentsCount,
      shares_count: post.sharesCount,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    };

    await this.getDb().insertInto('posts').values(postData).execute();

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    const result = await this.getDb()
      .selectFrom('posts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapToEntity(result);
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const countQuery = this.getDb()
      .selectFrom('posts')
      .select(sql`count(*)::int`.as('count'))
      .where('user_id', '=', userId);

    const postsQuery = this.getDb()
      .selectFrom('posts')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [countResult, postsResult] = await Promise.all([
      countQuery.executeTakeFirst(),
      postsQuery.execute(),
    ]);

    const total = Number(countResult?.count) || 0;
    const posts = postsResult.map((row) => this.mapToEntity(row));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async findFeed(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const countQuery = this.getDb()
      .selectFrom('posts')
      .select(sql`count(*)::int`.as('count'))
      .where('visibility', 'in', ['public', 'friends']);

    const postsQuery = this.getDb()
      .selectFrom('posts')
      .selectAll()
      .where('visibility', 'in', ['public', 'friends'])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [countResult, postsResult] = await Promise.all([
      countQuery.executeTakeFirst(),
      postsQuery.execute(),
    ]);

    const total = Number(countResult?.count) || 0;
    const posts = postsResult.map((row) => this.mapToEntity(row));

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrevious,
    };
  }

  async update(post: Post): Promise<Post> {
    const updateData = {
      content: post.content,
      visibility: post.visibility,
      media: JSON.stringify(post.media),
      tags: post.tags,
      likes_count: post.likesCount,
      comments_count: post.commentsCount,
      shares_count: post.sharesCount,
      updated_at: this.now(),
    };

    await this.getDb()
      .updateTable('posts')
      .set(updateData)
      .where('id', '=', post.id)
      .execute();

    return post;
  }

  async delete(id: string): Promise<void> {
    await this.getDb()
      .transaction()
      .execute(async (trx) => {
        await trx.deleteFrom('post_likes').where('post_id', '=', id).execute();

        await trx
          .deleteFrom('post_comments')
          .where('post_id', '=', id)
          .execute();

        await trx.deleteFrom('posts').where('id', '=', id).execute();
      });
  }

  async addLike(postId: string, userId: string): Promise<void> {
    await this.getDb()
      .transaction()
      .execute(async (trx) => {
        const existingLike = await trx
          .selectFrom('post_likes')
          .selectAll()
          .where('post_id', '=', postId)
          .where('user_id', '=', userId)
          .executeTakeFirst();

        if (!existingLike) {
          await trx
            .insertInto('post_likes')
            .values({
              post_id: postId,
              user_id: userId,
              created_at: this.now(),
            })
            .execute();

          await trx
            .updateTable('posts')
            .set({
              likes_count: sql`likes_count + 1`,
              updated_at: this.now(),
            })
            .where('id', '=', postId)
            .execute();
        }
      });
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    await this.getDb()
      .transaction()
      .execute(async (trx) => {
        const deleteResult = await trx
          .deleteFrom('post_likes')
          .where('post_id', '=', postId)
          .where('user_id', '=', userId)
          .execute();

        if (deleteResult.length > 0) {
          await trx
            .updateTable('posts')
            .set({
              likes_count: sql`GREATEST(0, likes_count - 1)`,
              updated_at: this.now(),
            })
            .where('id', '=', postId)
            .execute();
        }
      });
  }

  async incrementCounter(
    postId: string,
    counter: 'likes' | 'comments' | 'shares',
  ): Promise<void> {
    const columnName = `${counter}_count`;

    await this.getDb()
      .updateTable('posts')
      .set({
        [columnName]: sql`${sql.ref(columnName)} + 1`,
        updated_at: this.now(),
      })
      .where('id', '=', postId)
      .execute();
  }

  async decrementCounter(
    postId: string,
    counter: 'likes' | 'comments' | 'shares',
  ): Promise<void> {
    const columnName = `${counter}_count`;

    await this.getDb()
      .updateTable('posts')
      .set({
        [columnName]: sql`GREATEST(0, ${sql.ref(columnName)} - 1)`,
        updated_at: this.now(),
      })
      .where('id', '=', postId)
      .execute();
  }

  async findTrending(limit: number): Promise<Post[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.getDb()
      .selectFrom('posts')
      .selectAll()
      .where('visibility', 'in', ['public', 'friends'])
      .where('created_at', '>=', twentyFourHoursAgo)
      .orderBy('likes_count', 'desc')
      .orderBy('comments_count', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();

    return result.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: any): Post {
    const mediaData =
      typeof row.media === 'string' ? JSON.parse(row.media) : row.media || [];

    return Post.reconstitute({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      visibility: row.visibility,
      media: mediaData,
      tags: row.tags || [],
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      sharesCount: row.shares_count || 0,
      likedByUserIds: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
