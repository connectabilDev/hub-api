import { Conversation } from '../entities/conversation.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface ConversationRepositoryInterface {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findByParticipants(participantIds: string[]): Promise<Conversation | null>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Conversation>>;
  addParticipant(conversationId: string, userId: string): Promise<void>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  updateLastMessageAt(conversationId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
