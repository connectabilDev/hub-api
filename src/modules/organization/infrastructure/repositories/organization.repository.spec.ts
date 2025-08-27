import { Test, TestingModule } from '@nestjs/testing';
import { Kysely } from 'kysely';
import { OrganizationRepositoryImpl } from './organization.repository';
import {
  Organization,
  OrganizationStatus,
} from '../../domain/entities/organization.entity';
import { DATABASE_CONNECTION } from '../../../shared/infrastructure/database/database.module';

describe('OrganizationRepositoryImpl', () => {
  let repository: OrganizationRepositoryImpl;
  let mockDb: jest.Mocked<Kysely<any>>;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      insertInto: jest.fn().mockReturnThis(),
      selectFrom: jest.fn().mockReturnThis(),
      updateTable: jest.fn().mockReturnThis(),
      deleteFrom: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      doUpdateSet: jest.fn().mockReturnThis(),
      column: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      executeTakeFirst: jest.fn(),
    };

    mockDb = {
      insertInto: jest.fn().mockReturnValue(mockQueryBuilder),
      selectFrom: jest.fn().mockReturnValue(mockQueryBuilder),
      updateTable: jest.fn().mockReturnValue(mockQueryBuilder),
      deleteFrom: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationRepositoryImpl,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<OrganizationRepositoryImpl>(
      OrganizationRepositoryImpl,
    );
  });

  describe('save', () => {
    it('should save new organization', async () => {
      const organization = Organization.create(
        'test-org-123',
        'Test Organization',
        'Test description',
      );

      // Mock the organization's created_at date to avoid dependency on now() method
      jest
        .spyOn(organization, 'getCreatedAt')
        .mockReturnValue(new Date('2024-01-01T10:00:00.000Z'));
      mockQueryBuilder.execute.mockResolvedValue([]);

      const result = await repository.save(organization);

      expect(mockDb.insertInto).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.values).toHaveBeenCalledWith({
        organization_id: 'test-org-123',
        schema_name: 'org_test_org_123',
        name: 'Test Organization',
        description: 'Test description',
        status: OrganizationStatus.PROVISIONING,
        created_at: new Date('2024-01-01T10:00:00.000Z'),
        provisioned_at: undefined,
      });
      expect(mockQueryBuilder.onConflict).toHaveBeenCalled();
      expect(result).toBe(organization);
    });

    it('should save organization with upsert on conflict', async () => {
      const organization = Organization.reconstitute(
        'existing-org',
        'org_existing_org',
        'Updated Organization',
        'Updated description',
        OrganizationStatus.ACTIVE,
        new Date('2023-01-01'),
        new Date('2023-01-02'),
      );

      // Setup proper mock chain for onConflict and doUpdateSet
      const mockConflictBuilder = {
        column: jest.fn().mockReturnThis(),
        doUpdateSet: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.onConflict.mockImplementation((callback) => {
        callback(mockConflictBuilder);
        return mockQueryBuilder;
      });
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repository.save(organization);

      expect(mockQueryBuilder.onConflict).toHaveBeenCalled();
      expect(mockConflictBuilder.column).toHaveBeenCalledWith(
        'organization_id',
      );
      expect(mockConflictBuilder.doUpdateSet).toHaveBeenCalledWith({
        name: 'Updated Organization',
        description: 'Updated description',
        status: OrganizationStatus.ACTIVE,
        provisioned_at: organization.getProvisionedAt(),
      });
    });

    it('should handle save without description', async () => {
      const organization = Organization.create(
        'simple-org',
        'Simple Organization',
      );
      const mockDate = new Date('2024-01-01T10:00:00.000Z');

      jest.spyOn(repository as any, 'now').mockReturnValue(mockDate);
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repository.save(organization);

      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'simple-org',
          name: 'Simple Organization',
          description: undefined,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return organization when found', async () => {
      const mockRow = {
        organization_id: 'test-org-123',
        schema_name: 'org_test_org_123',
        name: 'Test Organization',
        description: 'Test description',
        status: 'active' as const,
        created_at: new Date('2023-01-01'),
        provisioned_at: new Date('2023-01-02'),
      };

      mockQueryBuilder.executeTakeFirst.mockResolvedValue(mockRow);

      const result = await repository.findById('test-org-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.selectAll).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'organization_id',
        '=',
        'test-org-123',
      );
      expect(result).toBeInstanceOf(Organization);
      expect(result?.getId()).toBe('test-org-123');
      expect(result?.getName()).toBe('Test Organization');
      expect(result?.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should return null when organization not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repository.findById('non-existent');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'organization_id',
        '=',
        'non-existent',
      );
      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.executeTakeFirst.mockRejectedValue(dbError);

      await expect(repository.findById('test-org')).rejects.toThrow(dbError);
    });
  });

  describe('findBySchemaName', () => {
    it('should return organization when found by schema name', async () => {
      const mockRow = {
        organization_id: 'test-org-123',
        schema_name: 'org_test_org_123',
        name: 'Test Organization',
        description: null,
        status: 'provisioning' as const,
        created_at: new Date('2023-01-01'),
        provisioned_at: null,
      };

      mockQueryBuilder.executeTakeFirst.mockResolvedValue(mockRow);

      const result = await repository.findBySchemaName('org_test_org_123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'schema_name',
        '=',
        'org_test_org_123',
      );
      expect(result).toBeInstanceOf(Organization);
      expect(result?.getSchemaName()).toBe('org_test_org_123');
      expect(result?.getDescription()).toBeNull();
      expect(result?.getStatus()).toBe(OrganizationStatus.PROVISIONING);
    });

    it('should return null when schema not found', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repository.findBySchemaName('org_non_existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all organizations ordered by created_at desc', async () => {
      const mockRows = [
        {
          organization_id: 'org-1',
          schema_name: 'org_org_1',
          name: 'Organization 1',
          description: 'Description 1',
          status: 'active' as const,
          created_at: new Date('2023-01-03'),
          provisioned_at: new Date('2023-01-03'),
        },
        {
          organization_id: 'org-2',
          schema_name: 'org_org_2',
          name: 'Organization 2',
          description: null,
          status: 'suspended' as const,
          created_at: new Date('2023-01-01'),
          provisioned_at: null,
        },
      ];

      mockQueryBuilder.execute.mockResolvedValue(mockRows);

      const result = await repository.findAll();

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.selectAll).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'created_at',
        'desc',
      );
      expect(result).toHaveLength(2);
      expect(result[0].getId()).toBe('org-1');
      expect(result[1].getId()).toBe('org-2');
    });

    it('should return empty array when no organizations exist', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update organization', async () => {
      const organization = Organization.reconstitute(
        'test-org-123',
        'org_test_org_123',
        'Updated Organization',
        'Updated description',
        OrganizationStatus.ACTIVE,
        new Date('2023-01-01'),
        new Date('2023-01-02'),
      );

      mockQueryBuilder.execute.mockResolvedValue([]);

      const result = await repository.update(organization);

      expect(mockDb.updateTable).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        name: 'Updated Organization',
        description: 'Updated description',
        status: OrganizationStatus.ACTIVE,
        provisioned_at: organization.getProvisionedAt(),
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'organization_id',
        '=',
        'test-org-123',
      );
      expect(result).toBe(organization);
    });

    it('should update organization without optional fields', async () => {
      const organization = Organization.reconstitute(
        'test-org-123',
        'org_test_org_123',
        'Updated Organization',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date('2023-01-01'),
      );

      mockQueryBuilder.execute.mockResolvedValue([]);

      await repository.update(organization);

      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        name: 'Updated Organization',
        description: undefined,
        status: OrganizationStatus.SUSPENDED,
        provisioned_at: undefined,
      });
    });
  });

  describe('delete', () => {
    it('should delete organization by id', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await repository.delete('test-org-123');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'organization_id',
        '=',
        'test-org-123',
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle delete operation even if organization does not exist', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);

      await expect(repository.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('existsById', () => {
    it('should return true when organization exists', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue({
        organization_id: 'test-org-123',
      });

      const result = await repository.existsById('test-org-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('organization_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'organization_id',
        '=',
        'test-org-123',
      );
      expect(result).toBe(true);
    });

    it('should return false when organization does not exist', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repository.existsById('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('existsBySchemaName', () => {
    it('should return true when schema exists', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue({
        schema_name: 'org_test_schema',
      });

      const result = await repository.existsBySchemaName('org_test_schema');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('organization_schemas');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('schema_name');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'schema_name',
        '=',
        'org_test_schema',
      );
      expect(result).toBe(true);
    });

    it('should return false when schema does not exist', async () => {
      mockQueryBuilder.executeTakeFirst.mockResolvedValue(undefined);

      const result = await repository.existsBySchemaName('org_non_existent');

      expect(result).toBe(false);
    });
  });

  describe('mapToEntity', () => {
    it('should map database row to organization entity with all fields', () => {
      const mockData = {
        organization_id: 'test-org-123',
        schema_name: 'org_test_org_123',
        name: 'Test Organization',
        description: 'Test description',
        status: 'active' as const,
        created_at: new Date('2023-01-01'),
        provisioned_at: new Date('2023-01-02'),
      };

      const result = (repository as any).mapToEntity(mockData);

      expect(result).toBeInstanceOf(Organization);
      expect(result.getId()).toBe('test-org-123');
      expect(result.getSchemaName()).toBe('org_test_org_123');
      expect(result.getName()).toBe('Test Organization');
      expect(result.getDescription()).toBe('Test description');
      expect(result.getStatus()).toBe(OrganizationStatus.ACTIVE);
      expect(result.getCreatedAt()).toEqual(new Date('2023-01-01'));
      expect(result.getProvisionedAt()).toEqual(new Date('2023-01-02'));
    });

    it('should map database row to organization entity with null optional fields', () => {
      const mockData = {
        organization_id: 'test-org-123',
        schema_name: 'org_test_org_123',
        name: 'Test Organization',
        description: null,
        status: 'provisioning' as const,
        created_at: new Date('2023-01-01'),
        provisioned_at: null,
      };

      const result = (repository as any).mapToEntity(mockData);

      expect(result.getDescription()).toBeNull();
      expect(result.getProvisionedAt()).toBeNull();
      expect(result.getStatus()).toBe(OrganizationStatus.PROVISIONING);
    });

    it('should handle all organization statuses correctly', () => {
      const statuses: Array<{
        dbStatus: string;
        entityStatus: OrganizationStatus;
      }> = [
        {
          dbStatus: 'provisioning',
          entityStatus: OrganizationStatus.PROVISIONING,
        },
        { dbStatus: 'active', entityStatus: OrganizationStatus.ACTIVE },
        { dbStatus: 'suspended', entityStatus: OrganizationStatus.SUSPENDED },
        { dbStatus: 'deleted', entityStatus: OrganizationStatus.DELETED },
      ];

      statuses.forEach(({ dbStatus, entityStatus }) => {
        const mockData = {
          organization_id: 'test-org',
          schema_name: 'org_test_org',
          name: 'Test Organization',
          description: null,
          status: dbStatus as any,
          created_at: new Date(),
          provisioned_at: null,
        };

        const result = (repository as any).mapToEntity(mockData);
        expect(result.getStatus()).toBe(entityStatus);
      });
    });
  });

  describe('error handling', () => {
    it('should propagate database errors in save operation', async () => {
      const organization = Organization.create('test-org', 'Test Organization');
      const dbError = new Error('Constraint violation');

      mockQueryBuilder.execute.mockRejectedValue(dbError);

      await expect(repository.save(organization)).rejects.toThrow(dbError);
    });

    it('should propagate database errors in update operation', async () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );
      const dbError = new Error('Update failed');

      mockQueryBuilder.execute.mockRejectedValue(dbError);

      await expect(repository.update(organization)).rejects.toThrow(dbError);
    });

    it('should propagate database errors in delete operation', async () => {
      const dbError = new Error('Delete failed');
      mockQueryBuilder.execute.mockRejectedValue(dbError);

      await expect(repository.delete('test-org')).rejects.toThrow(dbError);
    });
  });
});
