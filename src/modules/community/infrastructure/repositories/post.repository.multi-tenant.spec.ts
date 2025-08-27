import { Test, TestingModule } from '@nestjs/testing';
import { Kysely } from 'kysely';
import { PostRepositoryImpl } from './post.repository.impl';
import { PostMapper } from '../../application/mappers/post.mapper';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';
import { Database } from '../../../shared/infrastructure/database/database.types';
import { Post, PostVisibility } from '../../domain/entities/post.entity';

describe('PostRepository Multi-Tenant Isolation', () => {
  let repository: PostRepositoryImpl;
  let mockDb: jest.Mocked<Kysely<Database>>;
  let mockOrgDb1: jest.Mocked<Kysely<Database>>;
  let mockOrgDb2: jest.Mocked<Kysely<Database>>;
  let mockPostMapper: jest.Mocked<PostMapper>;

  const createMockDb = (orgId: string): jest.Mocked<Kysely<Database>> =>
    ({
      insertInto: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: `post-${orgId}` }]),
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      executeTakeFirst: jest
        .fn()
        .mockResolvedValue({ id: `post-${orgId}`, user_id: `user-${orgId}` }),
      transaction: jest.fn().mockReturnValue({
        execute: jest.fn().mockImplementation((fn) =>
          fn({
            deleteFrom: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({}),
          }),
        ),
      }),
    }) as any;

  beforeEach(async () => {
    mockDb = createMockDb('global');
    mockOrgDb1 = createMockDb('org1');
    mockOrgDb2 = createMockDb('org2');

    mockPostMapper = {
      toDto: jest.fn().mockReturnValue({ id: 'mapped-post' }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostRepositoryImpl,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: PostMapper,
          useValue: mockPostMapper,
        },
      ],
    }).compile();

    repository = module.get<PostRepositoryImpl>(PostRepositoryImpl);
  });

  describe('Tenant Isolation', () => {
    it('should isolate posts between different organizations', async () => {
      const post = Post.create({
        userId: 'user1',
        content: 'Test post',
        visibility: PostVisibility.PUBLIC,
        media: [],
        tags: [],
      });

      // Save post in organization 1
      repository.setOrganizationDb(mockOrgDb1);
      await repository.save(post);

      expect(mockOrgDb1.insertInto).toHaveBeenCalledWith('posts');
      expect(mockOrgDb2.insertInto).not.toHaveBeenCalled();
      expect(mockDb.insertInto).not.toHaveBeenCalled();

      // Save post in organization 2
      repository.setOrganizationDb(mockOrgDb2);
      await repository.save(post);

      expect(mockOrgDb2.insertInto).toHaveBeenCalledWith('posts');
      expect(mockOrgDb1.insertInto).toHaveBeenCalledTimes(1); // Should not increase
    });

    it('should retrieve posts only from current organization context', async () => {
      // Set context to organization 1
      repository.setOrganizationDb(mockOrgDb1);
      const result1 = await repository.findById('post-id');

      expect(mockOrgDb1.selectFrom).toHaveBeenCalledWith('posts');
      expect(mockOrgDb2.selectFrom).not.toHaveBeenCalled();

      // Set context to organization 2
      repository.setOrganizationDb(mockOrgDb2);
      const result2 = await repository.findById('post-id');

      expect(mockOrgDb2.selectFrom).toHaveBeenCalledWith('posts');
    });

    it('should prevent cross-organization data leakage in feed queries', async () => {
      const pagination = { page: 1, limit: 10 };

      // Query feed for organization 1
      repository.setOrganizationDb(mockOrgDb1);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue({ count: 5 }),
        selectAll: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([]),
      };

      mockOrgDb1.selectFrom.mockReturnValue(mockQuery as any);

      await repository.findFeed('user1', pagination);

      expect(mockOrgDb1.selectFrom).toHaveBeenCalledWith('posts');
      expect(mockOrgDb2.selectFrom).not.toHaveBeenCalled();
      expect(mockDb.selectFrom).not.toHaveBeenCalled();
    });

    it('should handle likes within organization boundaries', async () => {
      repository.setOrganizationDb(mockOrgDb1);

      const mockTransaction = {
        selectFrom: jest.fn().mockReturnThis(),
        selectAll: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        executeTakeFirst: jest.fn().mockResolvedValue(null),
        insertInto: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
        updateTable: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      };

      mockOrgDb1.transaction.mockReturnValue({
        execute: jest.fn().mockImplementation((fn) => fn(mockTransaction)),
      } as any);

      await repository.addLike('post-id', 'user-id');

      expect(mockOrgDb1.transaction).toHaveBeenCalled();
      expect(mockOrgDb2.transaction).not.toHaveBeenCalled();
    });

    it('should delete posts only from current organization', async () => {
      repository.setOrganizationDb(mockOrgDb1);

      const mockTransaction = {
        deleteFrom: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };

      mockOrgDb1.transaction.mockReturnValue({
        execute: jest.fn().mockImplementation((fn) => fn(mockTransaction)),
      } as any);

      await repository.delete('post-id');

      expect(mockOrgDb1.transaction).toHaveBeenCalled();
      expect(mockOrgDb2.transaction).not.toHaveBeenCalled();
    });
  });

  describe('Context Switching', () => {
    it('should correctly switch between organization contexts', async () => {
      const post = Post.create({
        userId: 'user1',
        content: 'Test post',
        visibility: PostVisibility.PUBLIC,
        media: [],
        tags: [],
      });

      // Start with no organization context (global)
      await repository.save(post);
      expect(mockDb.insertInto).toHaveBeenCalled();

      // Switch to org1
      repository.setOrganizationDb(mockOrgDb1);
      await repository.save(post);
      expect(mockOrgDb1.insertInto).toHaveBeenCalled();

      // Switch to org2
      repository.setOrganizationDb(mockOrgDb2);
      await repository.save(post);
      expect(mockOrgDb2.insertInto).toHaveBeenCalled();

      // Verify each db was called exactly once for insert
      expect(mockDb.insertInto).toHaveBeenCalledTimes(1);
      expect(mockOrgDb1.insertInto).toHaveBeenCalledTimes(1);
      expect(mockOrgDb2.insertInto).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors within organization context', async () => {
      repository.setOrganizationDb(mockOrgDb1);

      mockOrgDb1.insertInto.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const post = Post.create({
        userId: 'user1',
        content: 'Test post',
        visibility: PostVisibility.PUBLIC,
        media: [],
        tags: [],
      });

      await expect(repository.save(post)).rejects.toThrow('Database error');

      // Ensure error didn't affect other organization contexts
      repository.setOrganizationDb(mockOrgDb2);
      await expect(repository.save(post)).resolves.toBeDefined();
    });
  });
});
