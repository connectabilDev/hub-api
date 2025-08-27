import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InviteMemberUseCase } from './invite-member.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { InviteMemberDto } from '../../dtos/invite-member.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('InviteMemberUseCase', () => {
  let useCase: InviteMemberUseCase;
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
        createInvitation: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteMemberUseCase,
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

    useCase = module.get<InviteMemberUseCase>(InviteMemberUseCase);
  });

  describe('execute', () => {
    const organizationId = 'test-org-123';
    const inviteMemberDto: InviteMemberDto = {
      email: 'user@example.com',
      roleIds: ['admin', 'member'],
      message: 'Welcome to our organization!',
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

    const mockInvitationResponse = {
      id: 'invitation-123',
      invitee: 'user@example.com',
      organizationId: organizationId,
      status: 'Pending',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      expiresAt: '2023-01-08T00:00:00.000Z',
      organizationRoles: [
        { id: 'admin', name: 'Admin', description: 'Admin role' },
        { id: 'member', name: 'Member', description: 'Member role' },
      ],
    };

    beforeEach(() => {
      (
        mockLogtoClient.organizations.createInvitation as jest.Mock
      ).mockResolvedValue(mockInvitationResponse);
    });

    it('should create invitation with roles and message successfully', async () => {
      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, inviteMemberDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(
        mockLogtoClient.organizations.createInvitation,
      ).toHaveBeenCalledWith(
        organizationId,
        'user@example.com',
        ['admin', 'member'],
        'Welcome to our organization!',
      );
      expect(result.id).toBe('invitation-123');
      expect(result.invitee).toBe('user@example.com');
      expect(result.status).toBe('Pending');
    });

    it('should create invitation without roles successfully', async () => {
      const dtoWithoutRoles: InviteMemberDto = {
        email: 'user@example.com',
        message: 'Welcome!',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dtoWithoutRoles);

      expect(
        mockLogtoClient.organizations.createInvitation,
      ).toHaveBeenCalledWith(
        organizationId,
        'user@example.com',
        undefined,
        'Welcome!',
      );
    });

    it('should create invitation without message successfully', async () => {
      const dtoWithoutMessage: InviteMemberDto = {
        email: 'user@example.com',
        roleIds: ['member'],
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, dtoWithoutMessage);

      expect(
        mockLogtoClient.organizations.createInvitation,
      ).toHaveBeenCalledWith(
        organizationId,
        'user@example.com',
        ['member'],
        undefined,
      );
    });

    it('should create invitation with only email', async () => {
      const minimalDto: InviteMemberDto = {
        email: 'user@example.com',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, minimalDto);

      expect(
        mockLogtoClient.organizations.createInvitation,
      ).toHaveBeenCalledWith(
        organizationId,
        'user@example.com',
        undefined,
        undefined,
      );
    });

    it('should throw OrganizationNotFoundError when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(organizationId, inviteMemberDto),
      ).rejects.toThrow(new OrganizationNotFoundError(organizationId));

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(
        mockLogtoClient.organizations.createInvitation,
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
          useCase.execute(organizationId, inviteMemberDto),
        ).rejects.toThrow(
          new BadRequestException(
            'Cannot invite members to inactive organization',
          ),
        );

        expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
        expect(
          mockLogtoClient.organizations.createInvitation,
        ).not.toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when invitation creation fails', async () => {
      const logtoError = new Error('Invalid email address');
      mockRepository.findById.mockResolvedValue(activeOrganization);
      (
        mockLogtoClient.organizations.createInvitation as jest.Mock
      ).mockRejectedValue(logtoError);

      await expect(
        useCase.execute(organizationId, inviteMemberDto),
      ).rejects.toThrow(
        new BadRequestException(
          'Failed to create invitation: Invalid email address',
        ),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.createInvitation).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute(organizationId, inviteMemberDto),
      ).rejects.toThrow(repositoryError);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(
        mockLogtoClient.organizations.createInvitation,
      ).not.toHaveBeenCalled();
    });

    it('should work with different email formats', async () => {
      const emails = [
        'simple@example.com',
        'user+tag@example.com',
        'user.name@example.co.uk',
        'admin@sub.domain.org',
      ];

      mockRepository.findById.mockResolvedValue(activeOrganization);

      for (const email of emails) {
        const dto: InviteMemberDto = { email };

        await useCase.execute(organizationId, dto);

        expect(
          mockLogtoClient.organizations.createInvitation,
        ).toHaveBeenCalledWith(organizationId, email, undefined, undefined);
      }
    });

    it('should work with different role combinations', async () => {
      const roleCombinations = [
        ['owner'],
        ['admin', 'member'],
        ['viewer', 'contributor', 'admin'],
        ['custom-role-1', 'custom-role-2'],
      ];

      mockRepository.findById.mockResolvedValue(activeOrganization);

      for (const roleIds of roleCombinations) {
        const dto: InviteMemberDto = {
          email: 'user@example.com',
          roleIds,
        };

        await useCase.execute(organizationId, dto);

        expect(
          mockLogtoClient.organizations.createInvitation,
        ).toHaveBeenCalledWith(
          organizationId,
          'user@example.com',
          roleIds,
          undefined,
        );
      }
    });

    it('should map response correctly', async () => {
      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, inviteMemberDto);

      expect(result.id).toBe(mockInvitationResponse.id);
      expect(result.invitee).toBe(mockInvitationResponse.invitee);
      expect(result.organizationId).toBe(mockInvitationResponse.organizationId);
      expect(result.status).toBe(mockInvitationResponse.status);
      expect(result.createdAt).toEqual(
        new Date(mockInvitationResponse.createdAt),
      );
      expect(result.updatedAt).toEqual(
        new Date(mockInvitationResponse.updatedAt),
      );
      expect(result.expiresAt).toEqual(
        new Date(mockInvitationResponse.expiresAt),
      );
      expect(result.organizationRoles).toEqual(
        mockInvitationResponse.organizationRoles,
      );
    });

    it('should handle invitation response without roles', async () => {
      const responseWithoutRoles = {
        ...mockInvitationResponse,
        organizationRoles: undefined,
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);
      (
        mockLogtoClient.organizations.createInvitation as jest.Mock
      ).mockResolvedValue(responseWithoutRoles);

      const result = await useCase.execute(organizationId, inviteMemberDto);

      expect(result.organizationRoles).toBeUndefined();
    });
  });
});
