import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OrganizationContextMiddleware } from './organization-context.middleware';
import { OrganizationRepository } from '../../domain/repositories/organization.repository.interface';
import { SchemaManagerService } from '../../../shared/infrastructure/database/schema-manager.service';
import {
  Organization,
  OrganizationStatus,
} from '../../domain/entities/organization.entity';

describe('OrganizationContextMiddleware', () => {
  let middleware: OrganizationContextMiddleware;
  let mockRepository: jest.Mocked<OrganizationRepository>;
  let mockSchemaManager: jest.Mocked<SchemaManagerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

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

    mockSchemaManager = {
      provisionSchema: jest.fn(),
      getDbForSchema: jest.fn() as jest.MockedFunction<
        (schemaName: string) => any
      >,
    } as any;

    mockRequest = {
      headers: {},
      params: {},
      query: {},
      organization: undefined,
    };

    mockResponse = {};
    mockNext = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationContextMiddleware,
        {
          provide: 'ORGANIZATION_REPOSITORY',
          useValue: mockRepository,
        },
        {
          provide: SchemaManagerService,
          useValue: mockSchemaManager,
        },
      ],
    }).compile();

    middleware = module.get<OrganizationContextMiddleware>(
      OrganizationContextMiddleware,
    );
  });

  describe('use', () => {
    const activeOrganization = Organization.reconstitute(
      'test-org-123',
      'org_test_org_123',
      'Test Organization',
      'Test description',
      OrganizationStatus.ACTIVE,
      new Date('2023-01-01'),
      new Date('2023-01-02'),
    );

    const mockOrganizationDb: any = {
      selectFrom: jest.fn(),
      insertInto: jest.fn(),
      updateTable: jest.fn(),
      deleteFrom: jest.fn(),
    };

    beforeEach(() => {
      mockRepository.findById.mockResolvedValue(activeOrganization);
      mockSchemaManager.getDbForSchema.mockReturnValue(mockOrganizationDb);
    });

    it('should set organization context when organization ID in header', async () => {
      mockRequest.headers = { 'x-organization-id': 'test-org-123' };

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('test-org-123');
      expect(mockSchemaManager.getDbForSchema).toHaveBeenCalledWith(
        'org_test_org_123',
      );
      expect(mockRequest.organization).toEqual({
        organizationId: 'test-org-123',
        schemaName: 'org_test_org_123',
        organizationDb: mockOrganizationDb,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set organization context when organization ID in params', async () => {
      mockRequest.params = { organizationId: 'test-org-456' };

      const paramOrganization = Organization.reconstitute(
        'test-org-456',
        'org_test_org_456',
        'Param Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(paramOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('test-org-456');
      expect(mockRequest.organization?.organizationId).toBe('test-org-456');
      expect(mockRequest.organization?.schemaName).toBe('org_test_org_456');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set organization context when organization ID in query', async () => {
      mockRequest.query = { organizationId: 'test-org-789' };

      const queryOrganization = Organization.reconstitute(
        'test-org-789',
        'org_test_org_789',
        'Query Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(queryOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('test-org-789');
      expect(mockRequest.organization?.organizationId).toBe('test-org-789');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip middleware when no organization ID found', async () => {
      mockRequest.headers = {};
      mockRequest.params = {};
      mockRequest.query = {};

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockSchemaManager.getDbForSchema).not.toHaveBeenCalled();
      expect(mockRequest.organization).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw NotFoundException when organization not found', async () => {
      mockRequest.headers = { 'x-organization-id': 'non-existent-org' };
      mockRepository.findById.mockResolvedValue(null);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-org');
      expect(mockNext).toHaveBeenCalledWith(
        new NotFoundException('Organization non-existent-org not found'),
      );
    });

    it('should throw BadRequestException when organization is not active', async () => {
      const inactiveOrganization = Organization.reconstitute(
        'inactive-org',
        'org_inactive_org',
        'Inactive Organization',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date(),
      );

      mockRequest.headers = { 'x-organization-id': 'inactive-org' };
      mockRepository.findById.mockResolvedValue(inactiveOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        new BadRequestException('Organization inactive-org is not active'),
      );
    });

    it('should handle provisioning organization as inactive', async () => {
      const provisioningOrganization = Organization.create(
        'provisioning-org',
        'Provisioning Organization',
      );

      mockRequest.headers = { 'x-organization-id': 'provisioning-org' };
      mockRepository.findById.mockResolvedValue(provisioningOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        new BadRequestException('Organization provisioning-org is not active'),
      );
    });

    it('should handle deleted organization as inactive', async () => {
      const deletedOrganization = Organization.reconstitute(
        'deleted-org',
        'org_deleted_org',
        'Deleted Organization',
        undefined,
        OrganizationStatus.DELETED,
        new Date(),
      );

      mockRequest.headers = { 'x-organization-id': 'deleted-org' };
      mockRepository.findById.mockResolvedValue(deletedOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        new BadRequestException('Organization deleted-org is not active'),
      );
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRequest.headers = { 'x-organization-id': 'test-org-123' };
      mockRepository.findById.mockRejectedValue(repositoryError);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(repositoryError);
    });

    it('should handle schema manager errors', async () => {
      const schemaError = new Error('Schema not found');
      mockRequest.headers = { 'x-organization-id': 'test-org-123' };
      mockSchemaManager.getDbForSchema.mockImplementation(() => {
        throw schemaError;
      });

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(schemaError);
    });

    it('should prefer header over params over query', async () => {
      mockRequest.headers = { 'x-organization-id': 'org-from-header' };
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.query = { organizationId: 'org-from-query' };

      const headerOrganization = Organization.reconstitute(
        'org-from-header',
        'org_org_from_header',
        'Header Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(headerOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('org-from-header');
      expect(mockRequest.organization?.organizationId).toBe('org-from-header');
    });

    it('should prefer params over query when header not present', async () => {
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.query = { organizationId: 'org-from-query' };

      const paramsOrganization = Organization.reconstitute(
        'org-from-params',
        'org_org_from_params',
        'Params Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(paramsOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('org-from-params');
      expect(mockRequest.organization?.organizationId).toBe('org-from-params');
    });

    it('should use query when header and params not present', async () => {
      mockRequest.query = { organizationId: 'org-from-query' };

      const queryOrganization = Organization.reconstitute(
        'org-from-query',
        'org_org_from_query',
        'Query Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(queryOrganization);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith('org-from-query');
      expect(mockRequest.organization?.organizationId).toBe('org-from-query');
    });
  });

  describe('extractOrganizationId', () => {
    it('should extract organization ID from header with highest priority', () => {
      mockRequest.headers = { 'x-organization-id': 'org-from-header' };
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.query = { organizationId: 'org-from-query' };

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-header');
    });

    it('should extract organization ID from params when header not present', () => {
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.query = { organizationId: 'org-from-query' };

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-params');
    });

    it('should extract organization ID from query when header and params not present', () => {
      mockRequest.query = { organizationId: 'org-from-query' };

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-query');
    });

    it('should return null when no organization ID found', () => {
      mockRequest.headers = {};
      mockRequest.params = {};
      mockRequest.query = {};

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBeNull();
    });

    it('should handle undefined properties gracefully', () => {
      mockRequest.headers = undefined as any;
      mockRequest.params = undefined as any;
      mockRequest.query = undefined as any;

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBeNull();
    });

    it('should handle empty string organization IDs', () => {
      mockRequest.headers = { 'x-organization-id': '' };
      mockRequest.params = { organizationId: 'org-from-params' };

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-params');
    });

    it('should handle array values in query parameters', () => {
      mockRequest.query = { organizationId: ['org-1', 'org-2'] as any };

      const orgId = (middleware as any).extractOrganizationId(mockRequest);

      expect(orgId).toBeNull(); // Should handle non-string gracefully
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete successful flow with all context', async () => {
      const organization = Organization.reconstitute(
        'integration-org',
        'org_integration_org',
        'Integration Test Organization',
        'Complete test organization',
        OrganizationStatus.ACTIVE,
        new Date('2023-01-01'),
        new Date('2023-01-02'),
      );

      const integrationMockOrganizationDb: any = {
        selectFrom: jest.fn(),
        insertInto: jest.fn(),
        updateTable: jest.fn(),
        deleteFrom: jest.fn(),
      };

      mockRequest.headers = { 'x-organization-id': 'integration-org' };
      mockRepository.findById.mockResolvedValue(organization);
      mockSchemaManager.getDbForSchema.mockReturnValue(
        integrationMockOrganizationDb,
      );

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.organization).toEqual({
        organizationId: 'integration-org',
        schemaName: 'org_integration_org',
        organizationDb: integrationMockOrganizationDb,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle concurrent requests with different organization IDs', async () => {
      const org1 = Organization.reconstitute(
        'org-1',
        'org_org_1',
        'Organization 1',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      const org2 = Organization.reconstitute(
        'org-2',
        'org_org_2',
        'Organization 2',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      // First request
      const req1 = {
        ...mockRequest,
        headers: { 'x-organization-id': 'org-1' },
      };
      const next1 = jest.fn();
      mockRepository.findById.mockResolvedValueOnce(org1);

      await middleware.use(req1 as Request, mockResponse as Response, next1);

      expect(req1.organization?.organizationId).toBe('org-1');
      expect(next1).toHaveBeenCalledWith();

      // Second request
      const req2 = {
        ...mockRequest,
        headers: { 'x-organization-id': 'org-2' },
      };
      const next2 = jest.fn();
      mockRepository.findById.mockResolvedValueOnce(org2);

      await middleware.use(req2 as Request, mockResponse as Response, next2);

      expect(req2.organization?.organizationId).toBe('org-2');
      expect(next2).toHaveBeenCalledWith();
    });

    it('should handle edge case with special organization IDs', async () => {
      const specialOrgIds = [
        'org-with-special-chars_123',
        'org-UPPERCASE-test',
        'org-numbers-12345',
      ];

      for (const orgId of specialOrgIds) {
        const organization = Organization.reconstitute(
          orgId,
          `org_${orgId.replace(/-/g, '_').toLowerCase()}`,
          `Organization ${orgId}`,
          undefined,
          OrganizationStatus.ACTIVE,
          new Date(),
        );

        const request = {
          ...mockRequest,
          headers: { 'x-organization-id': orgId },
        };
        const next = jest.fn();

        mockRepository.findById.mockResolvedValueOnce(organization);

        await middleware.use(
          request as Request,
          mockResponse as Response,
          next,
        );

        expect(request.organization?.organizationId).toBe(orgId);
        expect(next).toHaveBeenCalledWith();
      }
    });
  });
});
