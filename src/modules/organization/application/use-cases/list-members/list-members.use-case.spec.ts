import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ListMembersUseCase } from './list-members.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { ListMembersDto } from '../../dtos/list-members.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('ListMembersUseCase', () => {
  let useCase: ListMembersUseCase;
  let mockRepository: jest.Mocked<OrganizationRepository>;
  let mockLogtoClient: jest.Mocked<LogtoManagementClient>;

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

    mockLogtoClient = {
      organizations: {
        getUsers: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListMembersUseCase,
        {
          provide: 'ORGANIZATION_REPOSITORY',
          useValue: mockRepository,
        },
        {
          provide: LogtoManagementClient,
          useValue: mockLogtoClient,
        },
      ],
    }).compile();

    useCase = module.get<ListMembersUseCase>(ListMembersUseCase);
  });

  describe('execute', () => {
    const organizationId = 'test-org-123';

    const activeOrganization = Organization.reconstitute(
      organizationId,
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    const mockUsers = [
      {
        id: 'user-1',
        username: 'john.doe',
        primaryEmail: 'john.doe@example.com',
        name: 'John Doe',
        avatar: 'https://example.com/avatar1.jpg',
      },
      {
        id: 'user-2',
        username: 'jane.smith',
        primaryEmail: 'jane.smith@example.com',
        primaryPhone: '+1234567890',
        name: 'Jane Smith',
      },
      {
        id: 'user-3',
        primaryEmail: 'admin@example.com',
        name: 'Admin User',
      },
    ];

    beforeEach(() => {
      mockLogtoClient.organizations.getUsers.mockResolvedValue(mockUsers);
    });

    it('should list members with default pagination', async () => {
      const dto: ListMembersDto = {};
      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, dto);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalledWith(
        organizationId,
        1,
        20,
      );
      expect(result.members).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
    });

    it('should list members with custom pagination', async () => {
      const dto: ListMembersDto = { page: 2, pageSize: 10 };
      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dto);

      expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalledWith(
        organizationId,
        2,
        10,
      );
    });

    it('should throw OrganizationNotFoundError when organization does not exist', async () => {
      const dto: ListMembersDto = {};
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(organizationId, dto)).rejects.toThrow(
        new OrganizationNotFoundError(organizationId),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.getUsers).not.toHaveBeenCalled();
    });

    it('should allow listing members from inactive organizations', async () => {
      const inactiveStatuses = [
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.SUSPENDED,
      ];

      for (const status of inactiveStatuses) {
        const inactiveOrg = Organization.reconstitute(
          organizationId,
          'org_test_org_123',
          'Test Organization',
          undefined,
          status,
          new Date(),
        );

        mockRepository.findById.mockResolvedValue(inactiveOrg);

        const result = await useCase.execute(organizationId, {});

        expect(result.members).toBeDefined();
        expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when listing members fails', async () => {
      const logtoError = new Error('Organization not found in Logto');
      const dto: ListMembersDto = {};

      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockLogtoClient.organizations.getUsers.mockRejectedValue(logtoError);

      await expect(useCase.execute(organizationId, dto)).rejects.toThrow(
        new BadRequestException(
          'Failed to list members: Organization not found in Logto',
        ),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      const dto: ListMembersDto = {};
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(organizationId, dto)).rejects.toThrow(
        repositoryError,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.getUsers).not.toHaveBeenCalled();
    });

    it('should map member data correctly', async () => {
      const dto: ListMembersDto = {};
      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, dto);

      const member1 = result.members[0];
      expect(member1.id).toBe('user-1');
      expect(member1.username).toBe('john.doe');
      expect(member1.primaryEmail).toBe('john.doe@example.com');
      expect(member1.name).toBe('John Doe');
      expect(member1.avatar).toBe('https://example.com/avatar1.jpg');

      const member2 = result.members[1];
      expect(member2.id).toBe('user-2');
      expect(member2.primaryPhone).toBe('+1234567890');

      const member3 = result.members[2];
      expect(member3.username).toBeUndefined();
      expect(member3.primaryPhone).toBeUndefined();
      expect(member3.avatar).toBeUndefined();
    });

    it('should handle empty member list', async () => {
      const dto: ListMembersDto = {};
      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockLogtoClient.organizations.getUsers.mockResolvedValue([]);

      const result = await useCase.execute(organizationId, dto);

      expect(result.members).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should work with different page sizes', async () => {
      const pageSizes = [1, 5, 10, 50, 100];

      mockRepository.findById.mockResolvedValue(activeOrganization);

      for (const pageSize of pageSizes) {
        const dto: ListMembersDto = { pageSize };

        await useCase.execute(organizationId, dto);

        expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalledWith(
          organizationId,
          1,
          pageSize,
        );
      }
    });

    it('should calculate pagination correctly for large datasets', async () => {
      const dto: ListMembersDto = { page: 3, pageSize: 2 };
      const largeUserSet = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        primaryEmail: `user${i}@example.com`,
      }));

      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockLogtoClient.organizations.getUsers.mockResolvedValue(
        largeUserSet.slice(4, 6),
      );

      const result = await useCase.execute(organizationId, dto);

      expect(mockLogtoClient.organizations.getUsers).toHaveBeenCalledWith(
        organizationId,
        3,
        2,
      );
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.pageSize).toBe(2);
    });

    it('should handle members with minimal data', async () => {
      const minimalUsers = [
        { id: 'user-minimal', primaryEmail: 'minimal@example.com' },
        { id: 'user-id-only' },
      ];

      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockLogtoClient.organizations.getUsers.mockResolvedValue(minimalUsers);

      const result = await useCase.execute(organizationId, {});

      expect(result.members).toHaveLength(2);
      expect(result.members[0].id).toBe('user-minimal');
      expect(result.members[0].username).toBeUndefined();
      expect(result.members[1].id).toBe('user-id-only');
      expect(result.members[1].primaryEmail).toBeUndefined();
    });
  });
});
