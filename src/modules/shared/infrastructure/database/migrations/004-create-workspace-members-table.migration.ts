import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateWorkspaceMembersTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('workspace_members')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('workspace_id', 'uuid', (col) =>
        col.notNull().references('workspaces.id').onDelete('cascade'),
      )
      .addColumn('user_id', 'varchar(255)', (col) => col.notNull())
      .addColumn('role', 'varchar(50)', (col) => col.notNull())
      .addColumn('invited_by', 'varchar(255)')
      .addColumn('invited_at', 'timestamp')
      .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('workspace_members_workspace_id_idx')
      .on('workspace_members')
      .column('workspace_id')
      .execute();

    await db.schema
      .createIndex('workspace_members_user_id_idx')
      .on('workspace_members')
      .column('user_id')
      .execute();

    await db.schema
      .createIndex('workspace_members_workspace_user_idx')
      .on('workspace_members')
      .columns(['workspace_id', 'user_id'])
      .unique()
      .execute();

    await db.schema
      .createIndex('workspace_members_is_active_idx')
      .on('workspace_members')
      .column('is_active')
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('workspace_members').execute();
  },
};
