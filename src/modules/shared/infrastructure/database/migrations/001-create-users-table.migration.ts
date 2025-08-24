import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateUsersTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('users')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
      .addColumn('name', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('users_email_idx')
      .on('users')
      .column('email')
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('users').execute();
  },
};
