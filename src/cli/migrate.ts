#!/usr/bin/env node
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigratorService } from '../modules/shared/infrastructure/database/migrations/migrator.service';
import { DatabaseConfigService } from '../modules/shared/infrastructure/database/database.config';
import { CreateUsersTableMigration } from '../modules/shared/infrastructure/database/migrations/001-create-users-table.migration';
import { CreateProductsTableMigration } from '../modules/shared/infrastructure/database/migrations/002-create-products-table.migration';
import { CreateCommunityTablesMigration } from '../modules/shared/infrastructure/database/migrations/005-create-community-tables.migration';

async function runMigrations() {
  console.log('Starting migrations...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const databaseConfig = app.get(DatabaseConfigService);

    const migrations = [
      { name: '001-create-users-table', migration: CreateUsersTableMigration },
      {
        name: '002-create-products-table',
        migration: CreateProductsTableMigration,
      },
      {
        name: '005-create-community-tables',
        migration: CreateCommunityTablesMigration,
      },
    ];

    const migrator = new MigratorService(databaseConfig, migrations);

    const command = process.argv[2];

    switch (command) {
      case 'up':
        await migrator.migrateToLatest();
        break;
      case 'down':
        await migrator.migrateDown();
        break;
      default:
        await migrator.migrateToLatest();
        break;
    }

    await migrator.close();
    await app.close();

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void runMigrations();
}
