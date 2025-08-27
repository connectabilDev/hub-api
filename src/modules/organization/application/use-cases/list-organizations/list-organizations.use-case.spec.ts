import { Test, TestingModule } from '@nestjs/testing';
import { ListOrganizationsUseCase } from './list-organizations.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { ListOrganizationsDto } from '../../dtos/list-organizations.dto';

describe('ListOrganizationsUseCase', () => {
  let useCase: ListOrganizationsUseCase;
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
        ListOrganizationsUseCase,
        {
          provide: 'ORGANIZATION_REPOSITORY',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListOrganizationsUseCase>(ListOrganizationsUseCase);
  });

  describe('execute', () => {
    const organizations = [
      Organization.reconstitute(
        'org-1',
        'org_org_1',
        'Organization 1',
        'Description 1',
        OrganizationStatus.ACTIVE,
        new Date('2023-01-01'),
        new Date('2023-01-02'),
      ),
      Organization.reconstitute(
        'org-2',
        'org_org_2',
        'Organization 2',
        'Description 2',
        OrganizationStatus.PROVISIONING,
        new Date('2023-02-01'),
      ),
      Organization.reconstitute(
        'org-3',
        'org_org_3',
        'Organization 3',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date('2023-03-01'),
        new Date('2023-03-02'),
      ),
    ];

    it('should return paginated organizations with default parameters', async () => {
      const dto: ListOrganizationsDto = {};
      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.execute(dto);

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result.organizations).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it('should return paginated organizations with custom page size', async () => {
      const dto: ListOrganizationsDto = { pageSize: 2 };
      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it('should return second page correctly', async () => {
      const dto: ListOrganizationsDto = { page: 2, pageSize: 2 };
      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].id).toBe('org-3');
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it('should filter organizations by search query', async () => {
      const dto: ListOrganizationsDto = { q: 'Organization 1' };
      const filteredOrgs = [organizations[0]];
      mockRepository.findAll.mockResolvedValue(filteredOrgs);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(1);
      expect(result.organizations[0].name).toBe('Organization 1');
    });

    it('should return empty results when no organizations match query', async () => {
      const dto: ListOrganizationsDto = { q: 'Non-existent' };
      mockRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it('should return empty page when requesting beyond available pages', async () => {
      const dto: ListOrganizationsDto = { page: 10, pageSize: 20 };
      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(0);
      expect(result.pagination.page).toBe(10);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it('should map organization data correctly', async () => {
      const dto: ListOrganizationsDto = {};
      mockRepository.findAll.mockResolvedValue([organizations[0]]);

      const result = await useCase.execute(dto);

      const mappedOrg = result.organizations[0];
      expect(mappedOrg.id).toBe('org-1');
      expect(mappedOrg.name).toBe('Organization 1');
      expect(mappedOrg.description).toBe('Description 1');
      expect(mappedOrg.status).toBe(OrganizationStatus.ACTIVE);
      expect(mappedOrg.createdAt).toEqual(new Date('2023-01-01'));
      expect(mappedOrg.provisionedAt).toEqual(new Date('2023-01-02'));
    });

    it('should handle organization without description', async () => {
      const dto: ListOrganizationsDto = {};
      mockRepository.findAll.mockResolvedValue([organizations[2]]);

      const result = await useCase.execute(dto);

      const mappedOrg = result.organizations[0];
      expect(mappedOrg.description).toBeUndefined();
    });

    it('should handle organization without provisionedAt', async () => {
      const dto: ListOrganizationsDto = {};
      mockRepository.findAll.mockResolvedValue([organizations[1]]);

      const result = await useCase.execute(dto);

      const mappedOrg = result.organizations[0];
      expect(mappedOrg.provisionedAt).toBeUndefined();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      const dto: ListOrganizationsDto = {};
      mockRepository.findAll.mockRejectedValue(repositoryError);

      await expect(useCase.execute(dto)).rejects.toThrow(repositoryError);

      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should work with edge cases for pagination', async () => {
      const dto: ListOrganizationsDto = { page: 1, pageSize: 100 };
      mockRepository.findAll.mockResolvedValue(organizations);

      const result = await useCase.execute(dto);

      expect(result.organizations).toHaveLength(3);
      expect(result.pagination.pageSize).toBe(100);
      expect(result.pagination.hasNext).toBe(false);
    });
  });
});
