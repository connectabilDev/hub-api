import { Workspace } from '../entities/workspace.entity';

export interface WorkspaceRepositoryInterface {
  save(workspace: Workspace): Promise<Workspace>;
  create(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findByOrganizationId(organizationId: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findByOwnerIdAndType(
    ownerId: string,
    type: string,
  ): Promise<Workspace | null>;
  findByUserId(userId: string): Promise<Workspace[]>;
  update(id: string, workspace: Partial<Workspace>): Promise<Workspace | null>;
  delete(id: string): Promise<boolean>;
}

export type IWorkspaceRepository = WorkspaceRepositoryInterface;

export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');
