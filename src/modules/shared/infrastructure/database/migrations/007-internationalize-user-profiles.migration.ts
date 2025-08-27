import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const InternationalizeUserProfilesMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .alterTable('user_profiles')
      .addColumn('nationality', 'varchar(2)')
      .addColumn('country_code', 'varchar(2)')
      .addColumn('identity_documents', 'jsonb')
      .addColumn('international_phone', 'varchar(20)')
      .addColumn('international_address', 'jsonb')
      .addColumn('locale_preferences', 'jsonb')
      .execute();

    await db.schema
      .alterTable('user_profiles')
      .alterColumn('cpf', (col) => col.dropNotNull())
      .alterColumn('rg', (col) => col.dropNotNull())
      .execute();

    await db.schema
      .createIndex('user_profiles_nationality_idx')
      .on('user_profiles')
      .column('nationality')
      .where('nationality', 'is not', null)
      .execute();

    await db.schema
      .createIndex('user_profiles_country_code_idx')
      .on('user_profiles')
      .column('country_code')
      .where('country_code', 'is not', null)
      .execute();

    await sql`
      UPDATE user_profiles
      SET 
        nationality = 'BR',
        country_code = 'BR',
        identity_documents = jsonb_build_object(
          'type', 'brazilian',
          'documents', jsonb_build_array(
            CASE 
              WHEN cpf IS NOT NULL THEN jsonb_build_object('type', 'cpf', 'value', cpf)
              ELSE NULL
            END,
            CASE 
              WHEN rg IS NOT NULL THEN jsonb_build_object('type', 'rg', 'value', rg)
              ELSE NULL
            END
          ) - NULL
        )
      WHERE cpf IS NOT NULL OR rg IS NOT NULL
    `.execute(db);
  },

  async down(db: Kysely<any>): Promise<void> {
    await sql`
      UPDATE user_profiles
      SET
        cpf = identity_documents->'documents'->0->>'value'
      WHERE 
        identity_documents->'type' = '"brazilian"' AND
        identity_documents->'documents'->0->>'type' = 'cpf'
    `.execute(db);

    await sql`
      UPDATE user_profiles
      SET
        rg = COALESCE(
          identity_documents->'documents'->1->>'value',
          identity_documents->'documents'->0->>'value'
        )
      WHERE 
        identity_documents->'type' = '"brazilian"' AND
        (identity_documents->'documents'->1->>'type' = 'rg' OR
         identity_documents->'documents'->0->>'type' = 'rg')
    `.execute(db);

    await db.schema
      .alterTable('user_profiles')
      .dropColumn('nationality')
      .dropColumn('country_code')
      .dropColumn('identity_documents')
      .dropColumn('international_phone')
      .dropColumn('international_address')
      .dropColumn('locale_preferences')
      .execute();
  },
};
