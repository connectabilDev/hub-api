import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import {
  Workspace,
  WorkspaceType,
} from '../../domain/entities/workspace.entity';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';
import {
  Database,
  Workspace as WorkspaceDb,
  NewWorkspace,
  WorkspaceUpdate,
} from '../../../shared/infrastructure/database/database.types';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

@Injectable()
export class WorkspaceRepositoryImpl
  extends BaseRepository
  implements IWorkspaceRepository
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    db: Kysely<Database>,
  ) {
    super(db);
  }

  async save(workspace: Workspace): Promise<Workspace> {
    return this.create(workspace);
  }

  async create(workspace: Workspace): Promise<Workspace> {
    const newWorkspace: NewWorkspace = {
      id: workspace.id,
      organization_id: workspace.organizationId,
      owner_id: workspace.ownerId,
      name: workspace.name,
      type: workspace.type,
      description: workspace.description || undefined,
      created_at: workspace.createdAt,
      updated_at: workspace.updatedAt,
    };

    const savedWorkspace = await this.db
      .insertInto('workspaces')
      .values(newWorkspace)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(savedWorkspace);
  }

  async findById(id: string): Promise<Workspace | null> {
    const workspace = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return workspace ? this.mapToDomain(workspace) : null;
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<Workspace | null> {
    const workspace = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'desc')
      .executeTakeFirst();

    return workspace ? this.mapToDomain(workspace) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const workspaces = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('owner_id', '=', ownerId)
      .orderBy('created_at', 'desc')
      .execute();

    return workspaces.map((workspace) => this.mapToDomain(workspace));
  }

  async findByOwnerIdAndType(
    ownerId: string,
    type: WorkspaceType,
  ): Promise<Workspace | null> {
    const workspace = await this.db
      .selectFrom('workspaces')
      .selectAll()
      .where('owner_id', '=', ownerId)
      .where('type', '=', type)
      .executeTakeFirst();

    return workspace ? this.mapToDomain(workspace) : null;
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    const workspaces = await this.db
      .selectFrom('workspaces')
      .innerJoin(
        'workspace_members',
        'workspace_members.workspace_id',
        'workspaces.id',
      )
      .selectAll('workspaces')
      .where('workspace_members.user_id', '=', userId)
      .where('workspace_members.is_active', '=', true)
      .orderBy('workspaces.created_at', 'desc')
      .execute();

    return workspaces.map((workspace) => this.mapToDomain(workspace));
  }

  async update(
    id: string,
    workspace: Partial<Workspace>,
  ): Promise<Workspace | null> {
    const updateData: WorkspaceUpdate = {
      ...(workspace.name && { name: workspace.name }),
      ...(workspace.description !== undefined && {
        description: workspace.description,
      }),
      updated_at: this.now(),
    };

    const updatedWorkspace = await this.db
      .updateTable('workspaces')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return updatedWorkspace ? this.mapToDomain(updatedWorkspace) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('workspaces')
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  private mapToDomain(workspace: WorkspaceDb): Workspace {
    return new Workspace({
      id: workspace.id,
      organizationId: workspace.organization_id,
      ownerId: workspace.owner_id,
      name: workspace.name,
      type: workspace.type as WorkspaceType,
      description:
        workspace.description === null ? undefined : workspace.description,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    });
  }
}
