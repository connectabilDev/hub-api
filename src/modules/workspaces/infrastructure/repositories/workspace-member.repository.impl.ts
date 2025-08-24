import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import { WorkspaceRole } from '../../domain/entities/workspace.entity';
import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { BaseRepository } from '../../../shared/infrastructure/database/base.repository';
import {
  Database,
  WorkspaceMember as WorkspaceMemberDb,
  NewWorkspaceMember,
  WorkspaceMemberUpdate,
} from '../../../shared/infrastructure/database/database.types';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

@Injectable()
export class WorkspaceMemberRepositoryImpl
  extends BaseRepository
  implements IWorkspaceMemberRepository
{
  constructor(
    @Inject(DATABASE_CONNECTION)
    db: Kysely<Database>,
  ) {
    super(db);
  }

  async save(member: WorkspaceMember): Promise<WorkspaceMember> {
    return this.create(member);
  }

  async create(member: WorkspaceMember): Promise<WorkspaceMember> {
    const newMember: NewWorkspaceMember = {
      id: member.id,
      workspace_id: member.workspaceId,
      user_id: member.userId,
      role: member.role,
      invited_by: member.invitedBy || null,
      invited_at: member.invitedAt || null,
      is_active: member.isActive,
      created_at: member.joinedAt,
      updated_at: member.joinedAt,
    };

    const savedMember = await this.db
      .insertInto('workspace_members')
      .values(newMember)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToDomain(savedMember);
  }

  async findById(id: string): Promise<WorkspaceMember | null> {
    const member = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return member ? this.mapToDomain(member) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<WorkspaceMember[]> {
    const members = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .execute();

    return members.map((member) => this.mapToDomain(member));
  }

  async findByUserId(userId: string): Promise<WorkspaceMember[]> {
    const members = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .execute();

    return members.map((member) => this.mapToDomain(member));
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    const member = await this.db
      .selectFrom('workspace_members')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    return member ? this.mapToDomain(member) : null;
  }

  async update(
    id: string,
    memberData: Partial<WorkspaceMember>,
  ): Promise<WorkspaceMember | null> {
    const updateData: WorkspaceMemberUpdate = {
      ...(memberData.role && { role: memberData.role }),
      ...(memberData.isActive !== undefined && {
        is_active: memberData.isActive,
      }),
      updated_at: this.now(),
    };

    const updatedMember = await this.db
      .updateTable('workspace_members')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return updatedMember ? this.mapToDomain(updatedMember) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('workspace_members')
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async deactivate(id: string): Promise<boolean> {
    const result = await this.db
      .updateTable('workspace_members')
      .set({
        is_active: false,
        updated_at: this.now(),
      })
      .where('id', '=', id)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }

  private mapToDomain(member: WorkspaceMemberDb): WorkspaceMember {
    return new WorkspaceMember({
      id: member.id,
      workspaceId: member.workspace_id,
      userId: member.user_id,
      role: member.role as WorkspaceRole,
      invitedBy: member.invited_by || undefined,
      invitedAt: member.invited_at || undefined,
      joinedAt: member.created_at,
      isActive: member.is_active,
    });
  }
}
