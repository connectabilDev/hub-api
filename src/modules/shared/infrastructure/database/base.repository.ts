import { Kysely, Transaction, SelectQueryBuilder } from 'kysely';
import { Database } from './database.types';

export abstract class BaseRepository {
  constructor(protected readonly db: Kysely<Database>) {}

  protected async withTransaction<T>(
    callback: (trx: Transaction<Database>) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction().execute(callback);
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected now(): Date {
    return new Date();
  }

  protected buildPaginationQuery<DB, TB extends keyof DB, O>(
    query: SelectQueryBuilder<DB, TB, O>,
    page: number = 1,
    limit: number = 10,
  ): SelectQueryBuilder<DB, TB, O> {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }

  protected async exists<T extends keyof Database>(
    tableName: T,
    field: string,
    value: unknown,
  ): Promise<boolean> {
    const query = this.db.selectFrom(tableName);

    const result = await (query as any)
      .select(field)
      .where(field, '=', value)
      .executeTakeFirst();

    return !!result;
  }
}
