import { Comment } from '../entities/comment.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface CommentRepositoryInterface {
  save(comment: Comment): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(
    postId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Comment>>;
  findReplies(parentCommentId: string): Promise<Comment[]>;
  update(comment: Comment): Promise<Comment>;
  delete(id: string): Promise<void>;
  countByPostId(postId: string): Promise<number>;
}

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');
