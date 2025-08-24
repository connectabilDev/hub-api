import { Kysely, sql } from 'kysely';
import { Migration } from './migration.interface';

export const CreateProductsTableMigration: Migration = {
  async up(db: Kysely<any>): Promise<void> {
    await db.schema
      .createTable('products')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text', (col) => col.notNull())
      .addColumn('sku', 'text', (col) => col.notNull().unique())
      .addColumn('price', 'integer', (col) =>
        col.notNull().check(sql`price >= 0`),
      )
      .addColumn('stock_quantity', 'integer', (col) =>
        col
          .notNull()
          .defaultTo(0)
          .check(sql`stock_quantity >= 0`),
      )
      .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
      .addColumn('created_at', 'timestamptz', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
      )
      .addColumn('updated_at', 'timestamptz', (col) =>
        col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
      )
      .execute();

    await db.schema
      .createIndex('products_sku_idx')
      .on('products')
      .column('sku')
      .execute();

    await db.schema
      .createIndex('products_active_idx')
      .on('products')
      .column('is_active')
      .execute();
  },

  async down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('products').execute();
  },
};
