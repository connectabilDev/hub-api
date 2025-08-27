import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrganizationUseCase } from './create-organization.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import { SchemaManagerService } from '../../../../shared/infrastructure/database/schema-manager.service';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { CreateOrganizationDto } from '../../dtos/create-organization.dto';
import { OrganizationAlreadyExistsError } from '../../../domain/errors/organization-not-found.error';

describe('CreateOrganizationUseCase', () => {
  let useCase: CreateOrganizationUseCase;
  let mockRepository: jest.Mocked<OrganizationRepository>;
  let mockLogtoClient: jest.Mocked<LogtoManagementClient>;
  let mockSchemaManager: jest.Mocked<SchemaManagerService>;

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

    mockSchemaManager = {
      provisionSchema: jest.fn(),
      getDbForSchema: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrganizationUseCase,
        {
          provide: 'ORGANIZATION_REPOSITORY',
          useValue: mockRepository,
        },
        {
          provide: LogtoManagementClient,
          useValue: mockLogtoClient,
        },
        {
          provide: SchemaManagerService,
          useValue: mockSchemaManager,
        },
      ],
    }).compile();

    useCase = module.get<CreateOrganizationUseCase>(CreateOrganizationUseCase);
  });

  describe('execute', () => {
    const mockLogtoOrg = {
      id: 'logto-org-123',
      name: 'Test Organization',
      description: 'Test description',
    };

    const createDto: CreateOrganizationDto = {
      name: 'Test Organization',
      description: 'Test description',
      ownerId: 'user-123',
    };

    beforeEach(() => {
      (mockLogtoClient.organizations.create as jest.Mock).mockResolvedValue(
        mockLogtoOrg,
      );
      mockRepository.existsById.mockResolvedValue(false);
      mockRepository.save.mockImplementation(async (org) => {
        await Promise.resolve();
        return org;
      });
      mockRepository.update.mockImplementation(async (org) => {
        await Promise.resolve();
        return org;
      });
      mockSchemaManager.provisionSchema.mockResolvedValue(undefined);
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockResolvedValue(undefined);
    });

    it('should create organization successfully with owner', async () => {
      const result = await useCase.execute(createDto);

      expect(mockLogtoClient.organizations.create).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'Test description',
      });

      expect(mockRepository.existsById).toHaveBeenCalledWith('logto-org-123');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getId: expect.any(Function),
          getName: expect.any(Function),
          getStatus: expect.any(Function),
        }),
      );

      expect(mockSchemaManager.provisionSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          getId: expect.any(Function),
        }),
      );

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalledWith(
        'logto-org-123',
        ['user-123'],
      );

      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).toHaveBeenCalledWith('logto-org-123', 'user-123', ['owner']);

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          getStatus: expect.any(Function),
        }),
      );

      expect(result).toBeInstanceOf(Organization);
      expect(result.getId()).toBe('logto-org-123');
      expect(result.getName()).toBe('Test Organization');
      expect(result.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should create organization successfully without owner', async () => {
      const dtoWithoutOwner: CreateOrganizationDto = {
        name: 'Test Organization',
        description: 'Test description',
      };

      const result = await useCase.execute(dtoWithoutOwner);

      expect(mockLogtoClient.organizations.create).toHaveBeenCalledWith({
        name: 'Test Organization',
        description: 'Test description',
      });

      expect(mockLogtoClient.organizations.addUsers).not.toHaveBeenCalled();
      expect(
        mockLogtoClient.organizations.assignUserRoles,
      ).not.toHaveBeenCalled();

      expect(result).toBeInstanceOf(Organization);
      expect(result.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should throw error if organization already exists', async () => {
      mockRepository.existsById.mockResolvedValue(true);

      await expect(useCase.execute(createDto)).rejects.toThrow(
        OrganizationAlreadyExistsError,
      );

      expect(mockLogtoClient.organizations.create).toHaveBeenCalled();
      expect(mockRepository.existsById).toHaveBeenCalledWith('logto-org-123');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should rollback if schema provisioning fails', async () => {
      const provisioningError = new Error('Schema provisioning failed');
      mockSchemaManager.provisionSchema.mockRejectedValue(provisioningError);

      await expect(useCase.execute(createDto)).rejects.toThrow(
        provisioningError,
      );

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockSchemaManager.provisionSchema).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.delete).toHaveBeenCalledWith(
        'logto-org-123',
      );
      expect(mockRepository.delete).toHaveBeenCalledWith('logto-org-123');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should rollback if adding user fails', async () => {
      const userError = new Error('Failed to add user');
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockRejectedValue(
        userError,
      );

      await expect(useCase.execute(createDto)).rejects.toThrow(userError);

      expect(mockSchemaManager.provisionSchema).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.delete).toHaveBeenCalledWith(
        'logto-org-123',
      );
      expect(mockRepository.delete).toHaveBeenCalledWith('logto-org-123');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should rollback if assigning roles fails', async () => {
      const roleError = new Error('Failed to assign roles');
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockRejectedValue(roleError);

      await expect(useCase.execute(createDto)).rejects.toThrow(roleError);

      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.assignUserRoles).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.delete).toHaveBeenCalledWith(
        'logto-org-123',
      );
      expect(mockRepository.delete).toHaveBeenCalledWith('logto-org-123');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should handle logto organization creation failure', async () => {
      const logtoError = new Error('Logto API error');
      (mockLogtoClient.organizations.create as jest.Mock).mockRejectedValue(
        logtoError,
      );

      await expect(useCase.execute(createDto)).rejects.toThrow(logtoError);

      expect(mockLogtoClient.organizations.create).toHaveBeenCalled();
      expect(mockRepository.existsById).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
      const saveError = new Error('Database save error');
      mockRepository.save.mockRejectedValue(saveError);

      await expect(useCase.execute(createDto)).rejects.toThrow(saveError);

      expect(mockLogtoClient.organizations.create).toHaveBeenCalled();
      expect(mockRepository.existsById).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockSchemaManager.provisionSchema).not.toHaveBeenCalled();
    });

    it('should create organization with correct schema name', async () => {
      const result = await useCase.execute(createDto);

      expect(result.getSchemaName()).toBe('org_logto_org_123');
    });

    it('should mark organization as provisioned after successful setup', async () => {
      const result = await useCase.execute(createDto);

      expect(result.getStatus()).toBe(OrganizationStatus.ACTIVE);
      expect(result.getProvisionedAt()).toBeDefined();
    });

    it('should handle minimal DTO', async () => {
      const minimalDto: CreateOrganizationDto = {
        name: 'Minimal Org',
      };

      const result = await useCase.execute(minimalDto);

      expect(mockLogtoClient.organizations.create).toHaveBeenCalledWith({
        name: 'Minimal Org',
        description: undefined,
      });

      expect(result.getName()).toBe('Minimal Org');
      expect(result.getDescription()).toBeUndefined();
    });
  });

  describe('error handling and rollback scenarios', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Test Organization',
      ownerId: 'user-123',
    };

    const mockLogtoOrg = {
      id: 'logto-org-123',
      name: 'Test Organization',
    };

    beforeEach(() => {
      (mockLogtoClient.organizations.create as jest.Mock).mockResolvedValue(
        mockLogtoOrg,
      );
      mockRepository.existsById.mockResolvedValue(false);
      mockRepository.save.mockImplementation(async (org) => {
        await Promise.resolve();
        return org;
      });
    });

    it('should cleanup successfully even if some rollback operations fail', async () => {
      const provisioningError = new Error('Schema provisioning failed');
      mockSchemaManager.provisionSchema.mockRejectedValue(provisioningError);

      const deleteError = new Error('Delete failed');
      (mockLogtoClient.organizations.delete as jest.Mock).mockRejectedValue(
        deleteError,
      );

      await expect(useCase.execute(createDto)).rejects.toThrow(
        provisioningError,
      );

      expect(mockLogtoClient.organizations.delete).toHaveBeenCalledWith(
        'logto-org-123',
      );
      expect(mockRepository.delete).toHaveBeenCalledWith('logto-org-123');
    });

    it('should handle complex rollback scenario with multiple failures', async () => {
      const roleError = new Error('Role assignment failed');
      (mockLogtoClient.organizations.addUsers as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockLogtoClient.organizations.assignUserRoles as jest.Mock
      ).mockRejectedValue(roleError);

      mockSchemaManager.provisionSchema.mockResolvedValue(undefined);

      await expect(useCase.execute(createDto)).rejects.toThrow(roleError);

      expect(mockSchemaManager.provisionSchema).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.addUsers).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.assignUserRoles).toHaveBeenCalled();
      expect(mockLogtoClient.organizations.delete).toHaveBeenCalledWith(
        'logto-org-123',
      );
      expect(mockRepository.delete).toHaveBeenCalledWith('logto-org-123');
    });
  });
});
