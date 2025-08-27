import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, BadRequestException } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization/create-organization.use-case';
import { GetOrganizationUseCase } from '../../application/use-cases/get-organization/get-organization.use-case';
import { AddMemberUseCase } from '../../application/use-cases/add-member/add-member.use-case';
import { RemoveMemberUseCase } from '../../application/use-cases/remove-member/remove-member.use-case';
import { ListOrganizationsUseCase } from '../../application/use-cases/list-organizations/list-organizations.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization/update-organization.use-case';
import { InviteMemberUseCase } from '../../application/use-cases/invite-member/invite-member.use-case';
import { ListMembersUseCase } from '../../application/use-cases/list-members/list-members.use-case';
import { OrganizationMapper } from '../../application/mappers/organization.mapper';
import { CreateOrganizationDto } from '../../application/dtos/create-organization.dto';
import {
  AddMemberDto,
  OrganizationRole,
} from '../../application/dtos/add-member.dto';
import { OrganizationResponseDto } from '../../application/dtos/organization-response.dto';
import {
  Organization,
  OrganizationStatus,
} from '../../domain/entities/organization.entity';
import type { CurrentUserData } from '../decorators/current-user.decorator';
import { LogtoManagementClient } from '../../../shared/infrastructure/clients/logto-management.client';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let mockCreateUseCase: jest.Mocked<CreateOrganizationUseCase>;
  let mockGetUseCase: jest.Mocked<GetOrganizationUseCase>;
  let mockAddMemberUseCase: jest.Mocked<AddMemberUseCase>;
  let mockRemoveMemberUseCase: jest.Mocked<RemoveMemberUseCase>;
  let mockListOrganizationsUseCase: jest.Mocked<ListOrganizationsUseCase>;
  let mockUpdateOrganizationUseCase: jest.Mocked<UpdateOrganizationUseCase>;
  let mockInviteMemberUseCase: jest.Mocked<InviteMemberUseCase>;
  let mockListMembersUseCase: jest.Mocked<ListMembersUseCase>;
  let mockMapper: jest.Mocked<OrganizationMapper>;

  beforeEach(async () => {
    mockCreateUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetUseCase = {
      execute: jest.fn(),
      executeBySchemaName: jest.fn(),
      getAll: jest.fn(),
    } as any;

    mockAddMemberUseCase = {
      execute: jest.fn(),
    } as any;

    mockRemoveMemberUseCase = {
      execute: jest.fn(),
    } as any;

    mockListOrganizationsUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateOrganizationUseCase = {
      execute: jest.fn(),
    } as any;

    mockInviteMemberUseCase = {
      execute: jest.fn(),
    } as any;

    mockListMembersUseCase = {
      execute: jest.fn(),
    } as any;

    mockMapper = {
      toDto: jest.fn(),
      toDtoArray: jest.fn(),
    } as any;

    const mockLogtoClient = {
      organizations: {
        create: jest.fn(),
        delete: jest.fn(),
        addUsers: jest.fn(),
        assignUserRoles: jest.fn(),
        getUserOrganizations: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: CreateOrganizationUseCase,
          useValue: mockCreateUseCase,
        },
        {
          provide: GetOrganizationUseCase,
          useValue: mockGetUseCase,
        },
        {
          provide: AddMemberUseCase,
          useValue: mockAddMemberUseCase,
        },
        {
          provide: RemoveMemberUseCase,
          useValue: mockRemoveMemberUseCase,
        },
        {
          provide: ListOrganizationsUseCase,
          useValue: mockListOrganizationsUseCase,
        },
        {
          provide: UpdateOrganizationUseCase,
          useValue: mockUpdateOrganizationUseCase,
        },
        {
          provide: InviteMemberUseCase,
          useValue: mockInviteMemberUseCase,
        },
        {
          provide: ListMembersUseCase,
          useValue: mockListMembersUseCase,
        },
        {
          provide: OrganizationMapper,
          useValue: mockMapper,
        },
        {
          provide: LogtoManagementClient,
          useValue: mockLogtoClient,
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  describe('createOrganization', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Test Organization',
      description: 'Test description',
    };

    const currentUser: CurrentUserData = {
      id: 'user-123',
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockOrganization = Organization.reconstitute(
      'org-123',
      'org_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    const mockResponseDto: OrganizationResponseDto = {
      id: 'org-123',
      name: 'Test Organization',
      description: 'Test description',
      schemaName: 'org_org_123',
      status: OrganizationStatus.ACTIVE,
      createdAt: new Date('2023-01-01'),
      provisionedAt: new Date('2023-01-02'),
    };

    beforeEach(() => {
      mockCreateUseCase.execute.mockResolvedValue(mockOrganization);
      mockMapper.toDto.mockReturnValue(mockResponseDto);
    });

    it('should create organization with current user as owner', async () => {
      const result = await controller.createOrganization(
        createDto,
        currentUser,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'Test description',
        ownerId: 'user-123',
      });
      expect(mockMapper.toDto).toHaveBeenCalledWith(mockOrganization);
      expect(result).toBe(mockResponseDto);
    });

    it('should create organization without user (undefined user)', async () => {
      const result = await controller.createOrganization(
        createDto,
        undefined as any,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'Test description',
        ownerId: undefined,
      });
      expect(result).toBe(mockResponseDto);
    });

    it('should create organization with minimal data', async () => {
      const minimalDto: CreateOrganizationDto = {
        name: 'Minimal Organization',
      };

      const result = await controller.createOrganization(
        minimalDto,
        currentUser,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        name: 'Minimal Organization',
        ownerId: 'user-123',
      });
      expect(result).toBe(mockResponseDto);
    });

    it('should handle use case errors', async () => {
      const error = new BadRequestException('Organization already exists');
      mockCreateUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createOrganization(createDto, currentUser),
      ).rejects.toThrow(error);

      expect(mockCreateUseCase.execute).toHaveBeenCalled();
      expect(mockMapper.toDto).not.toHaveBeenCalled();
    });

    it('should handle user with different ID property', async () => {
      const userWithId: CurrentUserData = {
        id: 'user-456',
        sub: 'sub-456',
        email: 'another@example.com',
        name: 'Another User',
      };

      await controller.createOrganization(createDto, userWithId);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        ...createDto,
        ownerId: 'user-456',
      });
    });
  });

  describe('getOrganization', () => {
    const organizationId = 'test-org-123';
    const mockOrganization = Organization.reconstitute(
      organizationId,
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    const mockResponseDto: OrganizationResponseDto = {
      id: organizationId,
      name: 'Test Organization',
      description: 'Test description',
      schemaName: 'org_test_org_123',
      status: OrganizationStatus.ACTIVE,
      createdAt: new Date('2023-01-01'),
      provisionedAt: new Date('2023-01-02'),
    };

    beforeEach(() => {
      mockGetUseCase.execute.mockResolvedValue(mockOrganization);
      mockMapper.toDto.mockReturnValue(mockResponseDto);
    });

    it('should return organization by ID', async () => {
      const result = await controller.getOrganization(organizationId);

      expect(mockGetUseCase.execute).toHaveBeenCalledWith(organizationId);
      expect(mockMapper.toDto).toHaveBeenCalledWith(mockOrganization);
      expect(result).toBe(mockResponseDto);
    });

    it('should handle different organization IDs', async () => {
      const differentOrgId = 'different-org-456';

      await controller.getOrganization(differentOrgId);

      expect(mockGetUseCase.execute).toHaveBeenCalledWith(differentOrgId);
    });

    it('should handle use case errors', async () => {
      const error = new BadRequestException('Organization not found');
      mockGetUseCase.execute.mockRejectedValue(error);

      await expect(controller.getOrganization(organizationId)).rejects.toThrow(
        error,
      );

      expect(mockGetUseCase.execute).toHaveBeenCalledWith(organizationId);
      expect(mockMapper.toDto).not.toHaveBeenCalled();
    });

    it('should handle organizations in different states', async () => {
      const statuses = [
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.ACTIVE,
        OrganizationStatus.SUSPENDED,
      ];

      for (const status of statuses) {
        const org = Organization.reconstitute(
          organizationId,
          'org_test_org_123',
          'Test Organization',
          undefined,
          status,
          new Date(),
        );

        const responseDto = {
          ...mockResponseDto,
          status,
          description: undefined,
        };

        mockGetUseCase.execute.mockResolvedValue(org);
        mockMapper.toDto.mockReturnValue(responseDto);

        const result = await controller.getOrganization(organizationId);

        expect(result.status).toBe(status);
      }
    });
  });

  describe('addMember', () => {
    const organizationId = 'test-org-123';
    const addMemberDto: AddMemberDto = {
      userId: 'user-456',
      role: OrganizationRole.MEMBER,
    };

    beforeEach(() => {
      mockAddMemberUseCase.execute.mockResolvedValue(undefined);
    });

    it('should add member successfully', async () => {
      const result = await controller.addMember(organizationId, addMemberDto);

      expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
        organizationId,
        addMemberDto,
      );
      expect(result).toEqual({ message: 'Member added successfully' });
    });

    it('should handle different roles', async () => {
      const roles = [
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.MEMBER,
      ];

      for (const role of roles) {
        const dto: AddMemberDto = {
          userId: 'user-789',
          role,
        };

        await controller.addMember(organizationId, dto);

        expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
          organizationId,
          dto,
        );
      }
    });

    it('should handle member addition without role', async () => {
      const dtoWithoutRole: AddMemberDto = {
        userId: 'user-456',
      };

      const result = await controller.addMember(organizationId, dtoWithoutRole);

      expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
        organizationId,
        dtoWithoutRole,
      );
      expect(result).toEqual({ message: 'Member added successfully' });
    });

    it('should handle use case errors', async () => {
      const error = new BadRequestException('User not found');
      mockAddMemberUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.addMember(organizationId, addMemberDto),
      ).rejects.toThrow(error);

      expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
        organizationId,
        addMemberDto,
      );
    });

    it('should handle different organization IDs', async () => {
      const differentOrgIds = ['org-123', 'org-456', 'special-org-789'];

      for (const orgId of differentOrgIds) {
        await controller.addMember(orgId, addMemberDto);

        expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
          orgId,
          addMemberDto,
        );
      }
    });

    it('should handle different user ID formats', async () => {
      const userIds = [
        'user-123',
        'uuid-550e8400-e29b-41d4-a716-446655440000',
        'auth0|user123',
        'logto-user-abc123',
      ];

      for (const userId of userIds) {
        const dto: AddMemberDto = {
          userId,
          role: OrganizationRole.MEMBER,
        };

        await controller.addMember(organizationId, dto);

        expect(mockAddMemberUseCase.execute).toHaveBeenCalledWith(
          organizationId,
          dto,
        );
      }
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      mockRemoveMemberUseCase.execute.mockResolvedValue(undefined);

      await controller.removeMember('org-123', 'user-456');

      expect(mockRemoveMemberUseCase.execute).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ userId: 'user-456' }),
      );
    });
  });

  describe('listOrganizations', () => {
    it('should list organizations successfully', async () => {
      const mockResult = {
        organizations: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };
      mockListOrganizationsUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.listOrganizations();

      expect(mockListOrganizationsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          q: undefined,
        }),
      );
      expect(result).toBe(mockResult);
    });

    it('should list organizations with parameters', async () => {
      const mockResult = {
        organizations: [],
        total: 0,
        page: 2,
        pageSize: 20,
      };
      mockListOrganizationsUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.listOrganizations(2, 20, 'test');

      expect(mockListOrganizationsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 20,
          q: 'test',
        }),
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle mapper errors in createOrganization', async () => {
      const createDto: CreateOrganizationDto = {
        name: 'Test Organization',
      };

      const currentUser: CurrentUserData = {
        id: 'user-123',
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockOrganization = Organization.create(
        'org-123',
        'Test Organization',
      );
      mockCreateUseCase.execute.mockResolvedValue(mockOrganization);

      const mapperError = new Error('Mapping failed');
      mockMapper.toDto.mockImplementation(() => {
        throw mapperError;
      });

      await expect(
        controller.createOrganization(createDto, currentUser),
      ).rejects.toThrow(mapperError);
    });

    it('should handle mapper errors in getOrganization', async () => {
      const organizationId = 'test-org-123';
      const mockOrganization = Organization.create(
        organizationId,
        'Test Organization',
      );

      mockGetUseCase.execute.mockResolvedValue(mockOrganization);

      const mapperError = new Error('Mapping failed');
      mockMapper.toDto.mockImplementation(() => {
        throw mapperError;
      });

      await expect(controller.getOrganization(organizationId)).rejects.toThrow(
        mapperError,
      );
    });

    it('should handle concurrent requests', async () => {
      const createDto: CreateOrganizationDto = {
        name: 'Concurrent Organization',
      };

      const user: CurrentUserData = {
        id: 'user-123',
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const org1 = Organization.create('org-1', 'Organization 1');
      const org2 = Organization.create('org-2', 'Organization 2');

      const responseDto1: OrganizationResponseDto = {
        id: 'org-1',
        name: 'Organization 1',
        schemaName: 'org_org_1',
        status: OrganizationStatus.PROVISIONING,
        createdAt: new Date(),
      } as any;

      const responseDto2: OrganizationResponseDto = {
        id: 'org-2',
        name: 'Organization 2',
        schemaName: 'org_org_2',
        status: OrganizationStatus.PROVISIONING,
        createdAt: new Date(),
      } as any;

      mockCreateUseCase.execute
        .mockResolvedValueOnce(org1)
        .mockResolvedValueOnce(org2);

      mockMapper.toDto
        .mockReturnValueOnce(responseDto1)
        .mockReturnValueOnce(responseDto2);

      const [result1, result2] = await Promise.all([
        controller.createOrganization(createDto, user),
        controller.createOrganization(createDto, user),
      ]);

      expect(result1.id).toBe('org-1');
      expect(result2.id).toBe('org-2');
    });

    it('should handle null/undefined in user data gracefully', async () => {
      const createDto: CreateOrganizationDto = {
        name: 'Test Organization',
      };

      const incompleteUser = {
        id: undefined,
        sub: null,
        email: 'test@example.com',
        name: 'Test User',
      } as any;

      const mockOrganization = Organization.create(
        'org-123',
        'Test Organization',
      );
      const mockResponseDto: OrganizationResponseDto = {
        id: 'org-123',
        name: 'Test Organization',
        schemaName: 'org_org_123',
        status: OrganizationStatus.PROVISIONING,
        createdAt: new Date(),
      } as any;

      mockCreateUseCase.execute.mockResolvedValue(mockOrganization);
      mockMapper.toDto.mockReturnValue(mockResponseDto);

      const result = await controller.createOrganization(
        createDto,
        incompleteUser,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        name: 'Test Organization',
        ownerId: undefined,
      });
      expect(result).toBe(mockResponseDto);
    });
  });
});
