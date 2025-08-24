import { Test, TestingModule } from '@nestjs/testing';
import { Kysely } from 'kysely';
import { UserRepositoryImpl } from './user.repository.impl';
import { UserEntity } from '../../domain/entities/user.entity';
import {
  Database,
  User,
} from '../../../shared/infrastructure/database/database.types';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let mockDb: jest.Mocked<Kysely<Database>>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  const mockUserEntity = new UserEntity(
    mockUser.id,
    mockUser.email,
    mockUser.name,
    mockUser.created_at,
    mockUser.updated_at,
  );

  beforeEach(async () => {
    const mockSelectFrom = jest.fn();
    const mockInsertInto = jest.fn();
    const mockUpdateTable = jest.fn();
    const mockDeleteFrom = jest.fn();

    mockDb = {
      selectFrom: mockSelectFrom,
      insertInto: mockInsertInto,
      updateTable: mockUpdateTable,
      deleteFrom: mockDeleteFrom,
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

    repository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user entity when user exists', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findById('user-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(mockSelectChain.selectAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.name).toBe(mockUser.name);
    });

    it('should return null when user does not exist', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(null),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockRejectedValue(error),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      await expect(repository.findById('user-123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user entity when user exists', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findByEmail('test@example.com');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when user with email does not exist', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(null),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save user and return user entity', async () => {
      const mockInsertChain = {
        values: jest.fn().mockReturnValue({
          returningAll: jest.fn().mockReturnValue({
            executeTakeFirstOrThrow: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };

      mockDb.insertInto.mockReturnValue(mockInsertChain as any);

      const result = await repository.save(mockUserEntity);

      expect(mockDb.insertInto).toHaveBeenCalledWith('users');
      expect(mockInsertChain.values).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe(mockUser.id);
    });

    it('should handle save errors', async () => {
      const error = new Error('Constraint violation');
      const mockInsertChain = {
        values: jest.fn().mockReturnValue({
          returningAll: jest.fn().mockReturnValue({
            executeTakeFirstOrThrow: jest.fn().mockRejectedValue(error),
          }),
        }),
      };

      mockDb.insertInto.mockReturnValue(mockInsertChain as any);

      await expect(repository.save(mockUserEntity)).rejects.toThrow(
        'Constraint violation',
      );
    });
  });

  describe('update', () => {
    it('should update user and return updated entity', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      const mockUpdateChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returningAll: jest.fn().mockReturnValue({
              executeTakeFirst: jest.fn().mockResolvedValue(updatedUser),
            }),
          }),
        }),
      };

      mockDb.updateTable.mockReturnValue(mockUpdateChain as any);

      const result = await repository.update('user-123', {
        name: 'Updated Name',
      });

      expect(mockDb.updateTable).toHaveBeenCalledWith('users');
      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        name: 'Updated Name',
        updated_at: expect.any(Date),
      });
      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null when user to update does not exist', async () => {
      const mockUpdateChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returningAll: jest.fn().mockReturnValue({
              executeTakeFirst: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      };

      mockDb.updateTable.mockReturnValue(mockUpdateChain as any);

      const result = await repository.update('nonexistent-id', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });

    it('should only update provided fields', async () => {
      const mockUpdateChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returningAll: jest.fn().mockReturnValue({
              executeTakeFirst: jest.fn().mockResolvedValue(mockUser),
            }),
          }),
        }),
      };

      mockDb.updateTable.mockReturnValue(mockUpdateChain as any);

      await repository.update('user-123', {});

      expect(mockUpdateChain.set).toHaveBeenCalledWith({
        updated_at: expect.any(Date),
      });
    });
  });

  describe('delete', () => {
    it('should delete user and return true when user exists', async () => {
      const mockDeleteChain = {
        where: jest.fn().mockReturnValue({
          executeTakeFirst: jest
            .fn()
            .mockResolvedValue({ numDeletedRows: BigInt(1) }),
        }),
      };

      mockDb.deleteFrom.mockReturnValue(mockDeleteChain as any);

      const result = await repository.delete('user-123');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('users');
      expect(result).toBe(true);
    });

    it('should return false when user to delete does not exist', async () => {
      const mockDeleteChain = {
        where: jest.fn().mockReturnValue({
          executeTakeFirst: jest
            .fn()
            .mockResolvedValue({ numDeletedRows: BigInt(0) }),
        }),
      };

      mockDb.deleteFrom.mockReturnValue(mockDeleteChain as any);

      const result = await repository.delete('nonexistent-id');

      expect(result).toBe(false);
    });

    it('should handle database errors during delete', async () => {
      const error = new Error('Database error');
      const mockDeleteChain = {
        where: jest.fn().mockReturnValue({
          executeTakeFirst: jest.fn().mockRejectedValue(error),
        }),
      };

      mockDb.deleteFrom.mockReturnValue(mockDeleteChain as any);

      await expect(repository.delete('user-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    const mockUsers: User[] = [
      { ...mockUser, id: 'user-1' },
      { ...mockUser, id: 'user-2', email: 'user2@example.com' },
      { ...mockUser, id: 'user-3', email: 'user3@example.com' },
    ];

    it('should return paginated list of users with default pagination', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue(mockUsers.slice(0, 2)),
              }),
            }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findAll();

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserEntity);
      expect(result[1]).toBeInstanceOf(UserEntity);
    });

    it('should return paginated list with custom page and limit', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue([mockUsers[2]]),
              }),
            }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findAll(2, 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(UserEntity);
    });

    it('should return empty array when no users found', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockReturnValue({
                execute: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user with email exists', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest
              .fn()
              .mockResolvedValue({ email: 'test@example.com' }),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.existsByEmail('test@example.com');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
      expect(result).toBe(true);
    });

    it('should return false when user with email does not exist', async () => {
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(null),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('mapToDomain', () => {
    it('should correctly map database user to domain entity', async () => {
      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findById('user-123');

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.name).toBe(mockUser.name);
      expect(result?.createdAt).toBe(mockUser.created_at);
      expect(result?.updatedAt).toBe(mockUser.updated_at);
    });

    it('should handle date mapping correctly', async () => {
      const userWithDates = {
        ...mockUser,
        created_at: new Date('2023-12-01T10:00:00Z'),
        updated_at: new Date('2023-12-02T15:30:00Z'),
      };

      const mockSelectChain = {
        selectAll: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(userWithDates),
          }),
        }),
      };

      mockDb.selectFrom.mockReturnValue(mockSelectChain as any);

      const result = await repository.findById('user-123');

      expect(result?.createdAt).toEqual(new Date('2023-12-01T10:00:00Z'));
      expect(result?.updatedAt).toEqual(new Date('2023-12-02T15:30:00Z'));
    });
  });
});
