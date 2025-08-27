import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { RemoveMemberDto } from '../../dtos/remove-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('RemoveMemberUseCase', () => {
  let useCase: RemoveMemberUseCase;
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
        removeUser: jest.fn(),
        getUsers: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveMemberUseCase,
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

    useCase = module.get<RemoveMemberUseCase>(RemoveMemberUseCase);
  });

  describe('execute', () => {
    const organizationId = 'test-org-123';
    const removeMemberDto: RemoveMemberDto = {
      userId: 'user-456',
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
      mockLogtoClient.organizations.removeUser.mockResolvedValue(undefined);
    });

    it('should remove member successfully', async () => {
      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, removeMemberDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.removeUser).toHaveBeenCalledWith(
        organizationId,
        'user-456',
      );
    });

    it('should throw OrganizationNotFoundError when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(organizationId, removeMemberDto),
      ).rejects.toThrow(new OrganizationNotFoundError(organizationId));

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.removeUser).not.toHaveBeenCalled();
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
          useCase.execute(organizationId, removeMemberDto),
        ).rejects.toThrow(
          new BadRequestException(
            'Cannot remove members from inactive organization',
          ),
        );

        expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
        expect(mockLogtoClient.organizations.removeUser).not.toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when removing user fails', async () => {
      const logtoError = new Error('User not found');
      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockLogtoClient.organizations.removeUser.mockRejectedValue(logtoError);

      await expect(
        useCase.execute(organizationId, removeMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Failed to remove member: User not found'),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.removeUser).toHaveBeenCalledWith(
        organizationId,
        'user-456',
      );
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute(organizationId, removeMemberDto),
      ).rejects.toThrow(repositoryError);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.removeUser).not.toHaveBeenCalled();
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
        const dto: RemoveMemberDto = { userId };

        await useCase.execute(organizationId, dto);

        expect(mockLogtoClient.organizations.removeUser).toHaveBeenCalledWith(
          organizationId,
          userId,
        );
      }
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
      mockLogtoClient.organizations.removeUser.mockRejectedValue(timeoutError);

      await expect(
        useCase.execute(organizationId, removeMemberDto),
      ).rejects.toThrow(
        new BadRequestException('Failed to remove member: Request timeout'),
      );
    });

    it('should validate organization status before proceeding', async () => {
      const provisioningOrg = Organization.create(
        organizationId,
        'Test Organization',
      );

      mockRepository.findById.mockResolvedValue(provisioningOrg);

      await expect(
        useCase.execute(organizationId, removeMemberDto),
      ).rejects.toThrow(
        new BadRequestException(
          'Cannot remove members from inactive organization',
        ),
      );

      expect(provisioningOrg.isActive()).toBe(false);
      expect(mockLogtoClient.organizations.removeUser).not.toHaveBeenCalled();
    });
  });
});
