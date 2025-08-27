import { Test, TestingModule } from '@nestjs/testing';
import { GetOrganizationUseCase } from './get-organization.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('GetOrganizationUseCase', () => {
  let useCase: GetOrganizationUseCase;
  let mockRepository: jest.Mocked<OrganizationRepository>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findBySchemaName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsBySchemaName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrganizationUseCase,
        {
          provide: 'ORGANIZATION_REPOSITORY',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetOrganizationUseCase>(GetOrganizationUseCase);
  });

  describe('execute', () => {
    const mockOrganization = Organization.reconstitute(
      'test-org-123',
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    it('should return organization when found by id', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);

      const result = await useCase.execute('test-org-123');

      expect(result).toBe(mockOrganization);
      expect(mockRepository.findById).toHaveBeenCalledWith('test-org-123');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw OrganizationNotFoundError when organization not found by id', async () => {
      const organizationId = 'non-existent-org';
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(organizationId)).rejects.toThrow(
        new OrganizationNotFoundError(organizationId),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute('test-org-123')).rejects.toThrow(
        repositoryError,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('test-org-123');
    });

    it('should work with different organization statuses', async () => {
      const statuses = [
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.ACTIVE,
        OrganizationStatus.SUSPENDED,
        OrganizationStatus.DELETED,
      ];

      for (const status of statuses) {
        const org = Organization.reconstitute(
          'test-org',
          'org_test_org',
          'Test Organization',
          undefined,
          status,
          new Date(),
        );

        mockRepository.findById.mockResolvedValue(org);

        const result = await useCase.execute('test-org');

        expect(result.getStatus()).toBe(status);
        expect(result).toBe(org);
      }
    });
  });

  describe('executeBySchemaName', () => {
    const mockOrganization = Organization.reconstitute(
      'test-org-123',
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    it('should return organization when found by schema name', async () => {
      const schemaName = 'org_test_org_123';
      mockRepository.findBySchemaName.mockResolvedValue(mockOrganization);

      const result = await useCase.executeBySchemaName(schemaName);

      expect(result).toBe(mockOrganization);
      expect(mockRepository.findBySchemaName).toHaveBeenCalledWith(schemaName);
      expect(mockRepository.findBySchemaName).toHaveBeenCalledTimes(1);
    });

    it('should throw OrganizationNotFoundError when organization not found by schema name', async () => {
      const schemaName = 'org_non_existent';
      mockRepository.findBySchemaName.mockResolvedValue(null);

      await expect(useCase.executeBySchemaName(schemaName)).rejects.toThrow(
        new OrganizationNotFoundError(`Schema: ${schemaName}`),
      );

      expect(mockRepository.findBySchemaName).toHaveBeenCalledWith(schemaName);
      expect(mockRepository.findBySchemaName).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors in schema name search', async () => {
      const repositoryError = new Error('Database query failed');
      const schemaName = 'org_test_org';
      mockRepository.findBySchemaName.mockRejectedValue(repositoryError);

      await expect(useCase.executeBySchemaName(schemaName)).rejects.toThrow(
        repositoryError,
      );

      expect(mockRepository.findBySchemaName).toHaveBeenCalledWith(schemaName);
    });

    it('should work with various schema name formats', async () => {
      const schemaNames = [
        'org_simple',
        'org_test_org_123',
        'org_long_organization_name_with_numbers_456',
        'org_a1b2c3',
      ];

      for (const schemaName of schemaNames) {
        const org = Organization.reconstitute(
          'test-org',
          schemaName,
          'Test Organization',
          undefined,
          OrganizationStatus.ACTIVE,
          new Date(),
        );

        mockRepository.findBySchemaName.mockResolvedValue(org);

        const result = await useCase.executeBySchemaName(schemaName);

        expect(result.getSchemaName()).toBe(schemaName);
        expect(result).toBe(org);
      }
    });
  });

  describe('getAll', () => {
    it('should return all organizations', async () => {
      const organizations = [
        Organization.reconstitute(
          'org-1',
          'org_org_1',
          'Organization 1',
          'Description 1',
          OrganizationStatus.ACTIVE,
          new Date('2023-01-01'),
        ),
        Organization.reconstitute(
          'org-2',
          'org_org_2',
          'Organization 2',
          'Description 2',
          OrganizationStatus.PROVISIONING,
          new Date('2023-01-02'),
        ),
        Organization.reconstitute(
          'org-3',
          'org_org_3',
          'Organization 3',
          undefined,
          OrganizationStatus.SUSPENDED,
          new Date('2023-01-03'),
        ),
      ];

      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.getAll();

      expect(result).toBe(organizations);
      expect(result).toHaveLength(3);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no organizations exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await useCase.getAll();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors in getAll', async () => {
      const repositoryError = new Error('Database connection lost');
      mockRepository.findAll.mockRejectedValue(repositoryError);

      await expect(useCase.getAll()).rejects.toThrow(repositoryError);

      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should preserve organization order from repository', async () => {
      const orgsInOrder = [
        Organization.reconstitute(
          'org-3',
          'org_org_3',
          'Org 3',
          undefined,
          OrganizationStatus.ACTIVE,
          new Date('2023-01-03'),
        ),
        Organization.reconstitute(
          'org-1',
          'org_org_1',
          'Org 1',
          undefined,
          OrganizationStatus.ACTIVE,
          new Date('2023-01-01'),
        ),
        Organization.reconstitute(
          'org-2',
          'org_org_2',
          'Org 2',
          undefined,
          OrganizationStatus.ACTIVE,
          new Date('2023-01-02'),
        ),
      ];

      mockRepository.findAll.mockResolvedValue(orgsInOrder);

      const result = await useCase.getAll();

      expect(result[0].getId()).toBe('org-3');
      expect(result[1].getId()).toBe('org-1');
      expect(result[2].getId()).toBe('org-2');
    });
  });

  describe('method integration', () => {
    it('should work correctly when called in sequence', async () => {
      const org1 = Organization.reconstitute(
        'org-1',
        'org_org_1',
        'Org 1',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      const org2 = Organization.reconstitute(
        'org-2',
        'org_org_2',
        'Org 2',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(org1);
      mockRepository.findBySchemaName.mockResolvedValue(org2);
      mockRepository.findAll.mockResolvedValue([org1, org2]);

      // Test all methods work independently
      const resultById = await useCase.execute('org-1');
      const resultBySchema = await useCase.executeBySchemaName('org_org_2');
      const allResults = await useCase.getAll();

      expect(resultById).toBe(org1);
      expect(resultBySchema).toBe(org2);
      expect(allResults).toEqual([org1, org2]);

      // Verify each method was called correctly
      expect(mockRepository.findById).toHaveBeenCalledWith('org-1');
      expect(mockRepository.findBySchemaName).toHaveBeenCalledWith('org_org_2');
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should handle mixed success and failure scenarios', async () => {
      const org = Organization.reconstitute(
        'org-1',
        'org_org_1',
        'Org 1',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(org);
      mockRepository.findBySchemaName.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([org]);

      // Success case
      const successResult = await useCase.execute('org-1');
      expect(successResult).toBe(org);

      // Failure case
      await expect(useCase.executeBySchemaName('non-existent')).rejects.toThrow(
        OrganizationNotFoundError,
      );

      // Success case
      const allResults = await useCase.getAll();
      expect(allResults).toEqual([org]);
    });
  });
});
