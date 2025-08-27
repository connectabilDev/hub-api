import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UpdateOrganizationUseCase } from './update-organization.use-case';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { LogtoManagementClient } from '../../../../shared/infrastructure/clients/logto-management.client';
import {
  Organization,
  OrganizationStatus,
} from '../../../domain/entities/organization.entity';
import { UpdateOrganizationDto } from '../../dtos/update-organization.dto';
import { OrganizationNotFoundError } from '../../../domain/errors/organization-not-found.error';

describe('UpdateOrganizationUseCase', () => {
  let useCase: UpdateOrganizationUseCase;
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
        update: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrganizationUseCase,
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

    useCase = module.get<UpdateOrganizationUseCase>(UpdateOrganizationUseCase);
  });

  describe('execute', () => {
    const organizationId = 'test-org-123';

    const activeOrganization = Organization.reconstitute(
      organizationId,
      'org_test_org_123',
      'Original Name',
      'Original Description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    beforeEach(() => {
      (mockLogtoClient.organizations.update as jest.Mock).mockResolvedValue({
        id: organizationId,
        name: 'Updated Name',
        description: 'Updated Description',
        createdAt: '2023-01-01T00:00:00.000Z',
      });
      mockRepository.update.mockResolvedValue(activeOrganization);
    });

    it('should update organization name and description successfully', async () => {
      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, updateDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { name: 'Updated Name', description: 'Updated Description' },
      );
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update only organization name when description is not provided', async () => {
      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Name Only',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, updateDto);

      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { name: 'Updated Name Only' },
      );
    });

    it('should update only organization description when name is not provided', async () => {
      const updateDto: UpdateOrganizationDto = {
        description: 'Updated Description Only',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, updateDto);

      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { description: 'Updated Description Only' },
      );
    });

    it('should throw BadRequestException when no fields are provided for update', async () => {
      const updateDto: UpdateOrganizationDto = {};

      await expect(useCase.execute(organizationId, updateDto)).rejects.toThrow(
        new BadRequestException(
          'At least one field must be provided for update',
        ),
      );

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockLogtoClient.organizations.update).not.toHaveBeenCalled();
    });

    it('should throw OrganizationNotFoundError when organization does not exist', async () => {
      const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };
      mockRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(organizationId, updateDto)).rejects.toThrow(
        new OrganizationNotFoundError(organizationId),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.update).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update organizations with different statuses', async () => {
      const statuses = [
        OrganizationStatus.ACTIVE,
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.SUSPENDED,
      ];

      for (const status of statuses) {
        const org = Organization.reconstitute(
          organizationId,
          'org_test_org_123',
          'Test Organization',
          'Test Description',
          status,
          new Date(),
        );

        mockRepository.findById.mockResolvedValue(org);

        const updateDto: UpdateOrganizationDto = { name: `Updated ${status}` };

        await useCase.execute(organizationId, updateDto);

        expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
          organizationId,
          { name: `Updated ${status}` },
        );
      }
    });

    it('should throw BadRequestException when Logto update fails', async () => {
      const logtoError = new Error('Logto update failed');
      const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };

      mockRepository.findById.mockResolvedValue(activeOrganization);
      (mockLogtoClient.organizations.update as jest.Mock).mockRejectedValue(
        logtoError,
      );

      await expect(useCase.execute(organizationId, updateDto)).rejects.toThrow(
        new BadRequestException(
          'Failed to update organization: Logto update failed',
        ),
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.update).toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when repository update fails', async () => {
      const repositoryError = new Error('Database update failed');
      const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };

      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockRepository.update.mockRejectedValue(repositoryError);

      await expect(useCase.execute(organizationId, updateDto)).rejects.toThrow(
        new BadRequestException(
          'Failed to update organization: Database update failed',
        ),
      );

      expect(mockLogtoClient.organizations.update).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should handle repository findById errors', async () => {
      const repositoryError = new Error('Database connection failed');
      const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute(organizationId, updateDto)).rejects.toThrow(
        repositoryError,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockLogtoClient.organizations.update).not.toHaveBeenCalled();
    });

    it('should handle empty string values correctly', async () => {
      const updateDto: UpdateOrganizationDto = {
        name: '',
        description: '',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, updateDto);

      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { description: '' },
      );
      expect(result).toBeDefined();
    });

    it('should handle whitespace-only values correctly', async () => {
      const updateDto: UpdateOrganizationDto = {
        name: '   ',
        description: '   ',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      const result = await useCase.execute(organizationId, updateDto);

      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { description: '' },
      );
      expect(result).toBeDefined();
    });

    it('should update with valid trimmed values', async () => {
      const updateDto: UpdateOrganizationDto = {
        name: '  Valid Name  ',
        description: '  Valid Description  ',
      };

      mockRepository.findById.mockResolvedValue(activeOrganization);

      await useCase.execute(organizationId, updateDto);

      expect(mockLogtoClient.organizations.update).toHaveBeenCalledWith(
        organizationId,
        { name: 'Valid Name', description: 'Valid Description' },
      );
    });
  });
});
