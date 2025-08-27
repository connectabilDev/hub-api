import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { BaseRepository } from './base.repository';
import { Database } from './database.types';

@Injectable()
export abstract class OrganizationAwareRepository extends BaseRepository {
  protected organizationDb: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    super(db);
    this.organizationDb = db;
  }

  setOrganizationDb(organizationDb: Kysely<Database>): void {
    this.organizationDb = organizationDb;
  }

  protected getDb(): Kysely<Database> {
    return this.organizationDb;
  }
}
