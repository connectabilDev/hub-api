import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { OrganizationMemberGuard } from './organization-member.guard';
import { LogtoManagementClient } from '../../../shared/infrastructure/clients/logto-management.client';
import { User } from '../../../auth/domain/entities/user.entity';

describe('OrganizationMemberGuard', () => {
  let guard: OrganizationMemberGuard;
  let mockLogtoClient: jest.Mocked<LogtoManagementClient>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockRequest: Partial<Request>;

  const createMockUser = (overrides: Partial<User> = {}): User => {
    return new User({
      id: overrides.id || 'user-123',
      email: overrides.email || 'test@example.com',
      name: overrides.name || 'Test User',
      sub: overrides.sub || 'user-123',
      iat: overrides.iat || Math.floor(Date.now() / 1000),
      exp: overrides.exp || Math.floor(Date.now() / 1000) + 3600,
      aud: overrides.aud || 'test-audience',
      iss: overrides.iss || 'test-issuer',
      roles: overrides.roles || [],
      scopes: overrides.scopes || [],
      organizations: overrides.organizations || [],
      organizationRoles: overrides.organizationRoles || [],
      ...overrides,
    });
  };

  beforeEach(async () => {
    const mockGetUserOrganizations = jest.fn();

    mockLogtoClient = {
      organizations: {
        getUserOrganizations: mockGetUserOrganizations,
        create: jest.fn(),
        delete: jest.fn(),
        addUsers: jest.fn(),
        assignUserRoles: jest.fn(),
      },
    } as any;

    mockRequest = {
      user: undefined,
      params: {},
      headers: {},
      organization: undefined,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMemberGuard,
        {
          provide: LogtoManagementClient,
          useValue: mockLogtoClient,
        },
      ],
    }).compile();

    guard = module.get<OrganizationMemberGuard>(OrganizationMemberGuard);
  });

  describe('canActivate', () => {
    const mockUserOrganizations = [
      { id: 'org-123', name: 'Organization 1' },
      { id: 'org-456', name: 'Organization 2' },
    ];

    beforeEach(() => {
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockResolvedValue(mockUserOrganizations);
    });

    it('should allow access when user is member of organization (from user.sub)', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-123' };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).toHaveBeenCalledWith('user-123');
    });

    it('should allow access when user is member of organization (from user.id)', async () => {
      mockRequest.user = createMockUser({ id: 'user-456' });
      mockRequest.params = { organizationId: 'org-456' };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).toHaveBeenCalledWith('user-456');
    });

    it('should allow access when organization id from header', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.headers = { 'x-organization-id': 'org-123' };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when organization id from request.organization', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      (mockRequest as any).organization = { organizationId: 'org-123' };

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user ID not found', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { organizationId: 'org-123' };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('User ID not found in request'),
      );

      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when organization ID not found', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = {};
      mockRequest.headers = {};

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Organization ID not found in request'),
      );

      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not member of organization', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-999' }; // Not in user's organizations

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException(
          'User user-123 is not a member of organization org-999',
        ),
      );

      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when Logto client fails', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-123' };

      const logtoError = new Error('Logto API error');
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockRejectedValue(logtoError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Failed to verify organization membership'),
      );
    });

    it('should propagate ForbiddenException from Logto client', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-123' };

      const forbiddenError = new ForbiddenException(
        'Access denied by external service',
      );
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockRejectedValue(forbiddenError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        forbiddenError,
      );
    });

    it('should handle empty user organizations list', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-123' };
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockResolvedValue([]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException(
          'User user-123 is not a member of organization org-123',
        ),
      );
    });

    it('should handle multiple organizations and find correct match', async () => {
      const manyOrganizations = [
        { id: 'org-001', name: 'Org 1' },
        { id: 'org-002', name: 'Org 2' },
        { id: 'org-003', name: 'Org 3' },
        { id: 'org-456', name: 'Target Org' },
        { id: 'org-005', name: 'Org 5' },
      ];

      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-456' };
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockResolvedValue(manyOrganizations);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('extractUserId', () => {
    it('should extract user ID from user.sub', () => {
      mockRequest.user = createMockUser({ sub: 'user-from-sub' });

      const userId = (guard as any).extractUserId(mockRequest);

      expect(userId).toBe('user-from-sub');
    });

    it('should extract user ID from user.id when sub is not available', () => {
      mockRequest.user = createMockUser({ id: 'user-from-id' });

      const userId = (guard as any).extractUserId(mockRequest);

      expect(userId).toBe('user-from-id');
    });

    it('should prefer user.sub over user.id', () => {
      mockRequest.user = createMockUser({
        sub: 'user-from-sub',
        id: 'user-from-id',
      });

      const userId = (guard as any).extractUserId(mockRequest);

      expect(userId).toBe('user-from-sub');
    });

    it('should return null when user is undefined', () => {
      mockRequest.user = undefined;

      const userId = (guard as any).extractUserId(mockRequest);

      expect(userId).toBeNull();
    });

    it('should return null when user has no sub or id', () => {
      mockRequest.user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const userId = (guard as any).extractUserId(mockRequest);

      expect(userId).toBeNull();
    });
  });

  describe('extractOrganizationId', () => {
    it('should extract organization ID from request.organization.organizationId', () => {
      (mockRequest as any).organization = {
        organizationId: 'org-from-context',
      };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-context');
    });

    it('should extract organization ID from request.params.organizationId when context not available', () => {
      mockRequest.params = { organizationId: 'org-from-params' };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-params');
    });

    it('should extract organization ID from x-organization-id header when others not available', () => {
      mockRequest.headers = { 'x-organization-id': 'org-from-header' };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-header');
    });

    it('should prefer request.organization over other sources', () => {
      (mockRequest as any).organization = {
        organizationId: 'org-from-context',
      };
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.headers = { 'x-organization-id': 'org-from-header' };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-context');
    });

    it('should prefer params over header when context not available', () => {
      mockRequest.params = { organizationId: 'org-from-params' };
      mockRequest.headers = { 'x-organization-id': 'org-from-header' };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-params');
    });

    it('should return null when no organization ID found', () => {
      mockRequest.params = {};
      mockRequest.headers = {};

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBeNull();
    });

    it('should handle undefined request.organization', () => {
      (mockRequest as any).organization = undefined;
      mockRequest.params = { organizationId: 'org-from-params' };

      const orgId = (guard as any).extractOrganizationId(mockRequest);

      expect(orgId).toBe('org-from-params');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete successful authentication flow', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123', name: 'Test User' });
      mockRequest.params = { organizationId: 'org-123' };
      mockRequest.headers = { 'x-organization-id': 'org-456' }; // Should be ignored in favor of params

      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockResolvedValue([
        { id: 'org-123', name: 'Test Organization' },
        { id: 'org-789', name: 'Other Organization' },
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).toHaveBeenCalledWith('user-123');
    });

    it('should handle authentication with header-based organization ID', async () => {
      mockRequest.user = createMockUser({ id: 'user-456' });
      mockRequest.headers = { 'x-organization-id': 'org-456' };

      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockResolvedValue([{ id: 'org-456', name: 'Header Organization' }]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(
        mockLogtoClient.organizations.getUserOrganizations,
      ).toHaveBeenCalledWith('user-456');
    });

    it('should handle complex error scenarios gracefully', async () => {
      mockRequest.user = createMockUser({ sub: 'user-123' });
      mockRequest.params = { organizationId: 'org-123' };

      // Simulate network timeout
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      (
        mockLogtoClient.organizations.getUserOrganizations as jest.Mock
      ).mockRejectedValue(timeoutError);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Failed to verify organization membership'),
      );
    });

    it('should work with different user ID formats', async () => {
      const userIdFormats = [
        'user-123',
        'uuid-550e8400-e29b-41d4-a716-446655440000',
        'auth0|user123',
        'google-oauth2|12345678901234567890',
      ];

      for (const userId of userIdFormats) {
        mockRequest.user = createMockUser({ sub: userId });
        mockRequest.params = { organizationId: 'org-123' };

        (
          mockLogtoClient.organizations.getUserOrganizations as jest.Mock
        ).mockResolvedValue([{ id: 'org-123', name: 'Test Organization' }]);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(
          mockLogtoClient.organizations.getUserOrganizations,
        ).toHaveBeenCalledWith(userId);
      }
    });
  });
});
