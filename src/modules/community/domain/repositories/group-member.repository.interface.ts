import { GroupMember, GroupMemberRole } from '../entities/group-member.entity';
import { PaginationParams, PaginatedResult } from './pagination.interface';

export interface GroupMemberRepositoryInterface {
  save(member: GroupMember): Promise<GroupMember>;
  findByGroupAndUser(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null>;
  findByGroupId(
    groupId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<GroupMember>>;
  findByUserId(userId: string): Promise<GroupMember[]>;
  updateRole(
    groupId: string,
    userId: string,
    role: GroupMemberRole,
  ): Promise<GroupMember>;
  delete(groupId: string, userId: string): Promise<void>;
  countByGroupId(groupId: string): Promise<number>;
}

export const GROUP_MEMBER_REPOSITORY = Symbol('GROUP_MEMBER_REPOSITORY');
