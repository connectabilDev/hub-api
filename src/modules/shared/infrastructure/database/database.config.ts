import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './database.types';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}

  get config(): DatabaseConfig {
    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      database: this.configService.get<string>('DB_NAME', 'hub'),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'password'),
      ssl: this.configService.get<boolean>('DB_SSL', false),
      max: this.configService.get<number>('DB_POOL_MAX', 20),
      idleTimeoutMillis: this.configService.get<number>(
        'DB_IDLE_TIMEOUT',
        30000,
      ),
      connectionTimeoutMillis: this.configService.get<number>(
        'DB_CONNECTION_TIMEOUT',
        2000,
      ),
    };
  }

  createKyselyInstance(): Kysely<Database> {
    const config = this.config;

    const dialect = new PostgresDialect({
      pool: new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: false,
        max: config.max,
        idleTimeoutMillis: config.idleTimeoutMillis,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
      }),
    });

    return new Kysely<Database>({ dialect });
  }
}
