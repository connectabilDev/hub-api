import { Injectable, Logger } from '@nestjs/common';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Migration, MigrationInfo } from './migration.interface';
import { DatabaseConfigService } from '../database.config';

@Injectable()
export class MigratorService {
  private readonly logger = new Logger(MigratorService.name);
  private readonly db: Kysely<any>;
  private readonly migrator: Migrator;

  constructor(
    private readonly databaseConfig: DatabaseConfigService,
    migrations: MigrationInfo[] = [],
  ) {
    this.db = this.createMigrationDb();
    this.migrator = new Migrator({
      db: this.db,
      provider: {
        getMigrations() {
          const migrationRecord: Record<string, Migration> = {};
          migrations.forEach(({ name, migration }) => {
            migrationRecord[name] = migration;
          });
          return Promise.resolve(migrationRecord);
        },
      },
    });
  }

  private createMigrationDb(): Kysely<any> {
    const config = this.databaseConfig.config;

    const dialect = new PostgresDialect({
      pool: new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl,
      }),
    });

    return new Kysely({ dialect });
  }

  async migrateToLatest(): Promise<void> {
    this.logger.log('Running migrations...');

    const { error, results } = await this.migrator.migrateToLatest();

    results?.forEach((it) => {
      if (it.status === 'Success') {
        this.logger.log(
          `Migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === 'Error') {
        this.logger.error(`Failed to execute migration "${it.migrationName}"`);
      }
    });

    if (error) {
      this.logger.error('Failed to migrate');
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    this.logger.log('Migrations completed successfully');
  }

  async migrateDown(): Promise<void> {
    this.logger.log('Running down migration...');

    const { error, results } = await this.migrator.migrateDown();

    results?.forEach((it) => {
      if (it.status === 'Success') {
        this.logger.log(
          `Down migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === 'Error') {
        this.logger.error(
          `Failed to execute down migration "${it.migrationName}"`,
        );
      }
    });

    if (error) {
      this.logger.error('Failed to run down migration');
      throw new Error(
        `Down migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    this.logger.log('Down migration completed successfully');
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}
