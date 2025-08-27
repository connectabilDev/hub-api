import { Group } from '../entities/group.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface GroupRepositoryInterface {
  save(group: Group): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findByName(name: string): Promise<Group | null>;
  findPublic(pagination: PaginationParams): Promise<PaginatedResult<Group>>;
  findByUserId(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Group>>;
  update(group: Group): Promise<Group>;
  delete(id: string): Promise<void>;
  incrementMemberCount(groupId: string): Promise<void>;
  decrementMemberCount(groupId: string): Promise<void>;
}

export const GROUP_REPOSITORY = Symbol('GROUP_REPOSITORY');
