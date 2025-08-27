import { Post } from '../entities/post.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface PostRepositoryInterface {
  save(post: Post): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Post>>;
  findFeed(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Post>>;
  update(post: Post): Promise<Post>;
  delete(id: string): Promise<void>;
  addLike(postId: string, userId: string): Promise<void>;
  removeLike(postId: string, userId: string): Promise<void>;
  incrementCounter(
    postId: string,
    counter: 'likes' | 'comments' | 'shares',
  ): Promise<void>;
  decrementCounter(
    postId: string,
    counter: 'likes' | 'comments' | 'shares',
  ): Promise<void>;
  findTrending(limit: number): Promise<Post[]>;
}

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');
