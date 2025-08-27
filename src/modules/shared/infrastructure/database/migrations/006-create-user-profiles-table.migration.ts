import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateUserProfilesTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('user_profiles')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn('logto_user_id', 'varchar(255)', (col) =>
        col.notNull().unique(),
      )
      .addColumn('full_name', 'varchar(255)', (col) => col.notNull())
      .addColumn('cpf', 'varchar(14)', (col) => col.unique())
      .addColumn('rg', 'varchar(20)')
      .addColumn('birth_date', 'date')
      .addColumn('gender', 'varchar(20)')
      .addColumn('phone', 'varchar(20)')
      .addColumn('whatsapp', 'varchar(20)')
      .addColumn('bio', 'text')
      .addColumn('headline', 'varchar(255)')
      .addColumn('address', 'jsonb')
      .addColumn('crc_number', 'varchar(20)')
      .addColumn('specializations', sql`text[]`)
      .addColumn('years_experience', 'integer')
      .addColumn('profile_completed', 'boolean', (col) =>
        col.defaultTo(false).notNull(),
      )
      .addColumn('onboarding_step', 'varchar(50)', (col) =>
        col.defaultTo('personal_info').notNull(),
      )
      .addColumn('verification_status', 'varchar(20)', (col) =>
        col.defaultTo('pending').notNull(),
      )
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`now()`).notNull(),
      )
      .execute();

    await db.schema
      .createIndex('user_profiles_logto_user_id_idx')
      .on('user_profiles')
      .column('logto_user_id')
      .execute();

    await db.schema
      .createIndex('user_profiles_cpf_idx')
      .on('user_profiles')
      .column('cpf')
      .where('cpf', 'is not', null)
      .execute();

    await db.schema
      .createIndex('user_profiles_full_name_idx')
      .on('user_profiles')
      .column('full_name')
      .execute();

    await db.schema
      .createIndex('user_profiles_verification_status_idx')
      .on('user_profiles')
      .column('verification_status')
      .execute();

    await db.schema
      .createIndex('user_profiles_profile_completed_idx')
      .on('user_profiles')
      .column('profile_completed')
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('user_profiles').execute();
  },
};
