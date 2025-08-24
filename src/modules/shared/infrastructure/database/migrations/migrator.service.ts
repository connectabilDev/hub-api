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
        ssl: false,
      }),
    });

    return new Kysely({ dialect });
  }

  async migrateToLatest(): Promise<void> {
    this.logger.log('Running migrations...');

    try {
      this.logger.log('Testing database connection...');
      await this.db.selectFrom('pg_database').selectAll().execute();
      this.logger.log('Database connection successful');
    } catch (dbError) {
      this.logger.error('Database connection failed:');
      this.logger.error(dbError);
      throw dbError;
    }

    this.logger.log('Calling migrator.migrateToLatest()...');
    const { error, results } = await this.migrator.migrateToLatest();

    this.logger.log(
      `Migration results: ${results ? results.length : 0} results`,
    );

    results?.forEach((it, index) => {
      this.logger.log(
        `Result ${index + 1}: status=${it.status}, migration=${it.migrationName}`,
      );
      if (it.status === 'Success') {
        this.logger.log(
          `Migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === 'Error') {
        this.logger.error(`Failed to execute migration "${it.migrationName}"`);
        this.logger.error(`Migration error details: ${JSON.stringify(it)}`);
      }
    });

    if (error) {
      this.logger.error('Migration failed with error:');
      this.logger.error(`Error type: ${typeof error}`);
      this.logger.error(`Error constructor: ${error.constructor.name}`);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      } else {
        this.logger.error(`Error details: ${JSON.stringify(error)}`);
      }
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
