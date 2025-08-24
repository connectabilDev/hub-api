import { Kysely, Transaction } from 'kysely';
import { BaseRepository } from './base.repository';
import { Database } from './database.types';

class TestRepository extends BaseRepository {
  constructor(db: Kysely<Database>) {
    super(db);
  }

  async testWithTransaction<T>(
    callback: (trx: Transaction<Database>) => Promise<T>,
  ): Promise<T> {
    return this.withTransaction(callback);
  }

  testGenerateId(): string {
    return this.generateId();
  }

  testNow(): Date {
    return this.now();
  }

  testBuildPaginationQuery(query: any, page?: number, limit?: number) {
    return this.buildPaginationQuery(query, page, limit);
  }

  async testExists(
    tableName: keyof Database,
    field: string,
    value: any,
  ): Promise<boolean> {
    return this.exists(tableName, field, value);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockDb: jest.Mocked<Kysely<Database>>;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      executeTakeFirst: jest.fn(),
    };

    mockDb = {
      transaction: jest.fn(),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn(),
          }),
        }),
      }),
    } as any;

    repository = new TestRepository(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withTransaction', () => {
    it('should execute callback within a transaction', async () => {
      const mockTransaction = {
        selectFrom: jest.fn(),
        insertInto: jest.fn(),
        updateTable: jest.fn(),
        deleteFrom: jest.fn(),
      } as any;

      const mockExecute = jest.fn().mockImplementation((callback) => {
        return callback(mockTransaction);
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const callback = jest.fn().mockResolvedValue('test-result');

      const result = await repository.testWithTransaction(callback);

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe('test-result');
    });

    it('should handle transaction errors properly', async () => {
      const error = new Error('Transaction failed');
      const mockExecute = jest.fn().mockRejectedValue(error);

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const callback = jest.fn().mockResolvedValue('test-result');

      await expect(repository.testWithTransaction(callback)).rejects.toThrow(
        'Transaction failed',
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('generateId', () => {
    it('should generate a valid UUID', () => {
      const id = repository.testGenerateId();

      expect(typeof id).toBe('string');
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = repository.testGenerateId();
      const id2 = repository.testGenerateId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('now', () => {
    it('should return current date', () => {
      const beforeCall = new Date();
      const now = repository.testNow();
      const afterCall = new Date();

      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(now.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('buildPaginationQuery', () => {
    it('should apply default pagination (page 1, limit 10)', () => {
      const result = repository.testBuildPaginationQuery(mockQuery);

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.offset).toHaveBeenCalledWith(0);
      expect(result).toBe(mockQuery);
    });

    it('should apply custom page and limit', () => {
      const result = repository.testBuildPaginationQuery(mockQuery, 3, 20);

      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockQuery.offset).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(result).toBe(mockQuery);
    });

    it('should handle page 1 correctly', () => {
      const result = repository.testBuildPaginationQuery(mockQuery, 1, 15);

      expect(mockQuery.limit).toHaveBeenCalledWith(15);
      expect(mockQuery.offset).toHaveBeenCalledWith(0);
      expect(result).toBe(mockQuery);
    });

    it('should handle large page numbers', () => {
      const result = repository.testBuildPaginationQuery(mockQuery, 100, 25);

      expect(mockQuery.limit).toHaveBeenCalledWith(25);
      expect(mockQuery.offset).toHaveBeenCalledWith(2475); // (100-1) * 25
      expect(result).toBe(mockQuery);
    });

    it('should handle zero and negative values gracefully', () => {
      const result = repository.testBuildPaginationQuery(mockQuery, 0, 5);

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(mockQuery.offset).toHaveBeenCalledWith(-5); // (0-1) * 5
      expect(result).toBe(mockQuery);
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue({ id: '123' }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.testExists(
        'users',
        'email',
        'test@example.com',
      );

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(mockSelectChain.select).toHaveBeenCalledWith('email');
      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(null),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.testExists(
        'users',
        'email',
        'nonexistent@example.com',
      );

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toBe(false);
    });

    it('should return false when record has falsy value', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.testExists(
        'products',
        'sku',
        'nonexistent-sku',
      );

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockRejectedValue(error),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      await expect(
        repository.testExists('users', 'email', 'test@example.com'),
      ).rejects.toThrow('Database connection failed');
    });

    it('should work with different table names and fields', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue({ sku: 'PROD-123' }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.testExists('products', 'sku', 'PROD-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('products');
      expect(mockSelectChain.select).toHaveBeenCalledWith('sku');
      expect(result).toBe(true);
    });
  });
});
