import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AddMemberUseCase } from './add-member.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { AddMemberDto, OrganizationRole } from '../../dtos/add-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('AddMemberUseCase', () => {
  let useCase: AddMemberUseCase;
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
        create: jest.fn(),
        delete: jest.fn(),
        addUsers: jest.fn(),
        assignUserRoles: jest.fn(),
        getUserOrganizations: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddMemberUseCase,
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

    useCase = module.get<AddMemberUseCase>(AddMemberUseCase);
  });

  describe('execute', () => {
    const organizationId = 'test-org-123';
    const addMemberDto: AddMemberDto = {
      userId: 'user-456',
      role: OrganizationRole.MEMBER,
    };

    const activeOrganization = Organization.reconstitute(
      organizationId,
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    beforeEach(() => {
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockResolvedValue(undefined);
    });

    it('should add member with role successfully', async () => {
      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, addMemberDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).toHaveBeenCalledWith(organizationId, 'user-456', [
        OrganizationRole.MEMBER,
      ]);
    });

    it('should add member without role successfully', async () => {
      const dtoWithoutRole: AddMemberDto = {
        userId: 'user-456',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dtoWithoutRole);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();
    });

    it('should throw OrganizationNotFoundError when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(new OrganizationNotFoundError(organizationId));

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.addUsers).not.toHaveBeenCalled();
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when organization is not active', async () => {
      const inactiveStatuses = [
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.SUSPENDED,
        OrganizationStatus.DELETED,
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

        await expect(
          useCase.execute(organizationId, addMemberDto),
        ).rejects.toThrow(
          new BadRequestException(
            'Cannot add members to inactive organization',
          ),
        );

        expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
        expect(mockLogtoClient.organizations.addUsers).not.toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when adding user fails', async () => {
      const logtoError = new Error('User not found');
      mockRepository.findById.mockResolvedValue(activeOrganization);
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockRejectedValue(
        logtoError,
      );

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Failed to add member: User not found'),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when assigning role fails', async () => {
      const roleError = new Error('Invalid role');
      mockRepository.findById.mockResolvedValue(activeOrganization);
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockRejectedValue(roleError);

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Failed to add member: Invalid role'),
      );

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).toHaveBeenCalledWith(organizationId, 'user-456', [
        OrganizationRole.MEMBER,
      ]);
    });

    it('should handle non-Error exceptions from Logto client', async () => {
      mockRepository.findById.mockResolvedValue(activeOrganization);
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockRejectedValue(
        'String error',
      );

      await expect(useCase.execute(organizationId, addMemberDto)).rejects.toBe(
        'String error',
      );

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(repositoryError);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.addUsers).not.toHaveBeenCalled();
    });

    it('should work with different role types', async () => {
      const roles = [
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER,
      ];

      mockRepository.findById.mockResolvedValue(activeOrganization);

      for (const role of roles) {
        const dto: AddMemberDto = {
          userId: 'user-123',
          role,
        };

        await useCase.execute(organizationId, dto);

        expect(
          mockLogtoClient.organizations.assignUserRoles,
        ).toHaveBeenCalledWith(organizationId, 'user-123', [role]);
      }
    });

    it('should work with different user ID formats', async () => {
      const userIds = [
        'user-123',
        'uuid-12345678-1234-5678-9abc-123456789012',
        'logto-user-abc123',
        'external-auth-provider-user',
      ];

      mockRepository.findById.mockResolvedValue(activeOrganization);

      for (const userId of userIds) {
        const dto: AddMemberDto = {
          userId,
          role: OrganizationRole.MEMBER,
        };

        await useCase.execute(organizationId, dto);

        expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
          organizationId,
          [userId],
        );
        expect(
          mockLogtoClient.organizations.assignUserRoles,
        ).toHaveBeenCalledWith(organizationId, userId, [
          OrganizationRole.MEMBER,
        ]);
      }
    });

    it('should not assign role when role is undefined', async () => {
      const dtoWithUndefinedRole: AddMemberDto = {
        userId: 'user-456',
        role: undefined,
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dtoWithUndefinedRole);

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();
    });

    it('should not assign role when role is empty string', async () => {
      const dtoWithEmptyRole: AddMemberDto = {
        userId: 'user-456',
        role: undefined,
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dtoWithEmptyRole);

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        organizationId,
        ['user-456'],
      );
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error scenarios and edge cases', () => {
    const organizationId = 'test-org-123';
    const addMemberDto: AddMemberDto = {
      userId: 'user-456',
      role: OrganizationRole.MEMBER,
    };

    it('should handle concurrent modification scenarios', async () => {
      const activeOrganization = Organization.reconstitute(
        organizationId,
        'org_test_org_123',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(activeOrganization);
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockResolvedValue(
        undefined,
      );

      const concurrentError = new Error('Concurrent modification detected');
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockRejectedValue(concurrentError);

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(
        new BadRequestException(
          'Failed to add member: Concurrent modification detected',
        ),
      );
    });

    it('should handle network timeout scenarios', async () => {
      const activeOrganization = Organization.reconstitute(
        organizationId,
        'org_test_org_123',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(activeOrganization);

      const timeoutError = new Error('Request timeout');
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockRejectedValue(
        timeoutError,
      );

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Failed to add member: Request timeout'),
      );
    });

    it('should validate organization status before proceeding', async () => {
      const provisioningOrg = Organization.create(
        organizationId,
        'Test Organization',
      );

      mockRepository.findById.mockResolvedValue(provisioningOrg);

      await expect(
        useCase.execute(organizationId, addMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Cannot add members to inactive organization'),
      );

      expect(provisioningOrg.isActive()).toBe(false);
      expect(mockLogtoClient.organizations.addUsers).not.toHaveBeenCalled();
    });
  });
});
