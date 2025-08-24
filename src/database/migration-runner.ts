import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigratorService } from '../modules/shared/infrastructure/database/migrations/migrator.service';
import { DatabaseConfigService } from '../modules/shared/infrastructure/database/database.config';
import { CreateUsersTableMigration } from '../modules/shared/infrastructure/database/migrations/001-create-users-table.migration';
import { CreateProductsTableMigration } from '../modules/shared/infrastructure/database/migrations/002-create-products-table.migration';

export class MigrationRunner {
  private readonly logger = new Logger(MigrationRunner.name);

  async run(): Promise<void> {
    this.logger.log('Starting database migrations...');

    let app;
    try {
      this.logger.log('Creating NestJS application context...');
      app = await NestFactory.createApplicationContext(AppModule);

      this.logger.log('Getting database configuration...');
      const databaseConfig = app.get(DatabaseConfigService);

      this.logger.log(
        `Database config: ${JSON.stringify({
          host: databaseConfig.config.host,
          port: databaseConfig.config.port,
          database: databaseConfig.config.database,
          username: databaseConfig.config.username,
        })}`,
      );

      const migrations = [
        {
          name: '001-create-users-table',
          migration: CreateUsersTableMigration,
        },
        {
          name: '002-create-products-table',
          migration: CreateProductsTableMigration,
        },
      ];

      this.logger.log(`Loaded ${migrations.length} migrations`);
      migrations.forEach((m) => this.logger.log(`Migration: ${m.name}`));

      this.logger.log('Creating migrator service...');
      const migrator = new MigratorService(databaseConfig, migrations);

      this.logger.log('Running migrations to latest...');
      await migrator.migrateToLatest();

      this.logger.log('Closing migrator connection...');
      await migrator.close();

      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Database migrations failed:');
      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      } else {
        this.logger.error(
          `Error (not Error instance): ${JSON.stringify(error)}`,
        );
      }
      throw error;
    } finally {
      if (app) {
        await app.close();
      }
    }
  }
}
