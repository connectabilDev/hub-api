import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('organization_schemas')
    .addColumn('organization_id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('schema_name', 'varchar(63)', (col) => col.notNull().unique())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(50)', (col) =>
      col
        .notNull()
        .defaultTo('provisioning')
        .check(
          sql`status IN ('provisioning', 'active', 'suspended', 'deleted')`,
        ),
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`NOW()`),
    )
    .addColumn('provisioned_at', 'timestamp')
    .execute();

  await db.schema
    .createIndex('idx_organization_schemas_status')
    .on('organization_schemas')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_organization_schemas_schema_name')
    .on('organization_schemas')
    .column('schema_name')
    .execute();

  await db.schema
    .createIndex('idx_organization_schemas_created_at')
    .on('organization_schemas')
    .columns(['created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('organization_schemas').execute();
}
