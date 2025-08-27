import { Test, TestingModule } from '@nestjs/testing';
import { Kysely } from 'kysely';
import { OrganizationAwareRepository } from './organization-aware.repository';
import { Database } from './database.types';

class TestOrganizationAwareRepository extends OrganizationAwareRepository {
  async testMethod(): Promise<any> {
    return this.getDb().selectFrom('posts').selectAll().execute();
  }
}

describe('OrganizationAwareRepository', () => {
  let repository: TestOrganizationAwareRepository;
  let mockDb: jest.Mocked<Kysely<Database>>;
  let mockOrganizationDb: jest.Mocked<Kysely<Database>>;

  beforeEach(async () => {
    mockDb = {
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    } as any;

    mockOrganizationDb = {
      selectFrom: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([{ id: 'org-specific' }]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TestOrganizationAwareRepository,
          useFactory: () => new TestOrganizationAwareRepository(mockDb),
        },
      ],
    }).compile();

    repository = module.get<TestOrganizationAwareRepository>(
      TestOrganizationAwareRepository,
    );
  });

  describe('setOrganizationDb', () => {
    it('should set organization database context', async () => {
      repository.setOrganizationDb(mockOrganizationDb);

      const result = await repository.testMethod();

      expect(mockOrganizationDb.selectFrom).toHaveBeenCalledWith('posts');
      expect(mockDb.selectFrom).not.toHaveBeenCalled();
      expect(result).toEqual([{ id: 'org-specific' }]);
    });

    it('should use global database when organization db not set', async () => {
      const result = await repository.testMethod();

      expect(mockDb.selectFrom).toHaveBeenCalledWith('posts');
      expect(mockOrganizationDb.selectFrom).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should switch between databases correctly', async () => {
      // First use global db
      await repository.testMethod();
      expect(mockDb.selectFrom).toHaveBeenCalledTimes(1);

      // Then set organization db and use it
      repository.setOrganizationDb(mockOrganizationDb);
      await repository.testMethod();
      expect(mockOrganizationDb.selectFrom).toHaveBeenCalledTimes(1);
      expect(mockDb.selectFrom).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  describe('getDb', () => {
    it('should return organization db when set', () => {
      repository.setOrganizationDb(mockOrganizationDb);
      const db = repository['getDb']();
      expect(db).toBe(mockOrganizationDb);
    });

    it('should return global db when organization db not set', () => {
      const db = repository['getDb']();
      expect(db).toBe(mockDb);
    });
  });
});
