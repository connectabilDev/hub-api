import { Kysely } from 'kysely';

export interface Migration {
  up(db: Kysely<any>): Promise<void>;
  down(db: Kysely<any>): Promise<void>;
}

export interface MigrationInfo {
  name: string;
  migration: Migration;
}

export type MigrationDirection = 'Up' | 'Down';

export interface MigrationResult {
  status: 'Success' | 'Error' | 'NotExecuted';
  migrationName: string;
  direction: MigrationDirection;
}
