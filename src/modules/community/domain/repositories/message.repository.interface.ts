import { Message } from '../entities/message.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface MessageRepositoryInterface {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversationId(
    conversationId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Message>>;
  update(message: Message): Promise<Message>;
  markAsRead(messageId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
