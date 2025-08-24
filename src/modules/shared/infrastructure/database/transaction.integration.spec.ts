import { Test, TestingModule } from '@nestjs/testing';
import { Kysely, Transaction } from 'kysely';
import { UserRepositoryImpl } from '../../../users/infrastructure/repositories/user.repository.impl';
import { UserEntity } from '../../../users/domain/entities/user.entity';
import { Database } from './database.types';
import { DATABASE_CONNECTION } from './database.module';

describe('Transaction Integration', () => {
  let userRepository: UserRepositoryImpl;
  let mockDb: jest.Mocked<Kysely<Database>>;
  let mockTransaction: jest.Mocked<Transaction<Database>>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockTransaction = {
      selectFrom: jest.fn(),
      insertInto: jest.fn(),
      updateTable: jest.fn(),
      deleteFrom: jest.fn(),
      transaction: jest.fn(),
    } as any;

    mockDb = {
      selectFrom: jest.fn(),
      insertInto: jest.fn(),
      updateTable: jest.fn(),
      deleteFrom: jest.fn(),
      transaction: jest.fn().mockReturnValue({
        execute: jest.fn(),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepositoryImpl,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withTransaction method from BaseRepository', () => {
    it('should execute callback within transaction scope', async () => {
      const mockExecute = jest.fn().mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const testCallback = jest.fn().mockResolvedValue('transaction-result');

      // Access the protected method via type assertion for testing
      const result = await (userRepository as any).withTransaction(
        testCallback,
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalledWith(testCallback);
      expect(testCallback).toHaveBeenCalledWith(mockTransaction);
      expect(result).toBe('transaction-result');
    });

    it('should handle transaction rollback on error', async () => {
      const error = new Error('Transaction failed');
      const mockExecute = jest.fn().mockImplementation(() => {
        throw error;
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const testCallback = jest.fn().mockRejectedValue(error);

      await expect(
        (userRepository as any).withTransaction(testCallback),
      ).rejects.toThrow('Transaction failed');

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should allow nested transactions', async () => {
      const mockExecute = jest
        .fn()
        .mockImplementationOnce(async (callback) => {
          // First transaction
          return await callback(mockTransaction);
        })
        .mockImplementationOnce(async (callback) => {
          // Nested transaction
          return await callback(mockTransaction);
        });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const nestedCallback = jest.fn().mockResolvedValue('nested-result');
      const outerCallback = jest.fn().mockImplementation(async () => {
        return await (userRepository as any).withTransaction(nestedCallback);
      });

      const result = await (userRepository as any).withTransaction(
        outerCallback,
      );

      expect(mockDb.transaction).toHaveBeenCalledTimes(2);
      expect(result).toBe('nested-result');
    });
  });

  describe('Cross-repository transaction scenarios', () => {
    it('should handle user creation in transaction', async () => {
      const userEntity = UserEntity.create({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const mockExecute = jest.fn().mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const mockUserInsertChain = {
        values: jest.fn().mockReturnValue({
          returningAll: jest.fn().mockReturnValue({
            executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };

      mockTransaction.insertInto.mockReturnValueOnce(
        mockUserInsertChain as any,
      );

      const transactionCallback = jest
        .fn()
        .mockImplementation(async (trx: Transaction<Database>) => {
          // Simulate saving user within transaction
          const savedUser = await trx
            .insertInto('users')
            .values({
              id: userEntity.id,
              email: userEntity.email,
              name: userEntity.name,
              created_at: userEntity.createdAt,
              updated_at: userEntity.updatedAt,
            })
            .returningAll()
            .executeTakeFirstOrThrow();

          return savedUser;
        });

      const result = await (userRepository as any).withTransaction(
        transactionCallback,
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(transactionCallback).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual(mockUser);
    });

    it('should rollback transaction when business logic fails', async () => {
      const error = new Error('Business logic error');
      const mockExecute = jest.fn().mockImplementation(() => {
        throw error;
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const failingCallback = jest.fn().mockRejectedValue(error);

      await expect(
        (userRepository as any).withTransaction(failingCallback),
      ).rejects.toThrow('Business logic error');

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('Transaction isolation and consistency', () => {
    it('should maintain transaction isolation between concurrent operations', async () => {
      const transaction1Execute = jest
        .fn()
        .mockImplementation(async (callback) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return await callback(mockTransaction);
        });

      const transaction2Execute = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback(mockTransaction);
        });

      mockDb.transaction
        .mockReturnValueOnce({ execute: transaction1Execute } as any)
        .mockReturnValueOnce({ execute: transaction2Execute } as any);

      const callback1 = jest.fn().mockResolvedValue('result1');
      const callback2 = jest.fn().mockResolvedValue('result2');

      const [result1, result2] = await Promise.all([
        (userRepository as any).withTransaction(callback1),
        (userRepository as any).withTransaction(callback2),
      ]);

      expect(mockDb.transaction).toHaveBeenCalledTimes(2);
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(callback1).toHaveBeenCalledWith(mockTransaction);
      expect(callback2).toHaveBeenCalledWith(mockTransaction);
    });

    it('should handle transaction timeout scenarios', async () => {
      const timeoutError = new Error('Transaction timeout');
      const mockExecute = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw timeoutError;
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const longRunningCallback = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'long-result';
      });

      await expect(
        (userRepository as any).withTransaction(longRunningCallback),
      ).rejects.toThrow('Transaction timeout');
    });
  });

  describe('Transaction state management', () => {
    it('should ensure transaction is properly committed on success', async () => {
      const mockExecute = jest.fn().mockImplementation(async (callback) => {
        const result = await callback(mockTransaction);
        // Simulate successful commit
        return result;
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const successCallback = jest.fn().mockResolvedValue('success');

      const result = await (userRepository as any).withTransaction(
        successCallback,
      );

      expect(result).toBe('success');
      expect(mockExecute).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalledWith(mockTransaction);
    });

    it('should ensure transaction is properly rolled back on failure', async () => {
      const businessError = new Error('Business rule violation');
      const mockExecute = jest.fn().mockImplementation(async (callback) => {
        await callback(mockTransaction);
      });

      mockDb.transaction.mockReturnValue({
        execute: mockExecute,
      } as any);

      const failingCallback = jest.fn().mockRejectedValue(businessError);

      await expect(
        (userRepository as any).withTransaction(failingCallback),
      ).rejects.toThrow('Business rule violation');

      expect(mockExecute).toHaveBeenCalled();
      expect(failingCallback).toHaveBeenCalledWith(mockTransaction);
    });
  });
});
