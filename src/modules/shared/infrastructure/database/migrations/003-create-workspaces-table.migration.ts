import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateWorkspacesTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('workspaces')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('organization_id', 'varchar(255)', (col) => col.notNull())
      .addColumn('owner_id', 'varchar(255)', (col) => col.notNull())
      .addColumn('name', 'varchar(255)', (col) => col.notNull())
      .addColumn('type', 'varchar(50)', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('workspaces_organization_id_idx')
      .on('workspaces')
      .column('organization_id')
      .execute();

    await db.schema
      .createIndex('workspaces_owner_id_idx')
      .on('workspaces')
      .column('owner_id')
      .execute();

    await db.schema
      .createIndex('workspaces_type_idx')
      .on('workspaces')
      .column('type')
      .execute();

    await db.schema
      .createIndex('workspaces_owner_type_idx')
      .on('workspaces')
      .columns(['owner_id', 'type'])
      .unique()
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('workspaces').execute();
  },
};
