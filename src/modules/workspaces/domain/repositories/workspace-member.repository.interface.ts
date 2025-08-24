import { WorkspaceMember } from '../entities/workspace-member.entity';

export interface WorkspaceMemberRepositoryInterface {
  save(member: WorkspaceMember): Promise<WorkspaceMember>;
  create(member: WorkspaceMember): Promise<WorkspaceMember>;
  findById(id: string): Promise<WorkspaceMember | null>;
  findByWorkspaceId(workspaceId: string): Promise<WorkspaceMember[]>;
  findByUserId(userId: string): Promise<WorkspaceMember[]>;
  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null>;
  update(
    id: string,
    member: Partial<WorkspaceMember>,
  ): Promise<WorkspaceMember | null>;
  delete(id: string): Promise<boolean>;
  deactivate(id: string): Promise<boolean>;
}

export type IWorkspaceMemberRepository = WorkspaceMemberRepositoryInterface;

export const WORKSPACE_MEMBER_REPOSITORY = Symbol(
  'WORKSPACE_MEMBER_REPOSITORY',
);
