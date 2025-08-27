import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { of } from 'rxjs';
import { OrganizationContextInterceptor } from './organization-context.interceptor';
import { OrganizationAwareRepository } from '../database/organization-aware.repository';
import { POST_REPOSITORY } from '../../../community/domain/repositories/post.repository.interface';

describe('OrganizationContextInterceptor', () => {
  let interceptor: OrganizationContextInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let moduleRef: jest.Mocked<ModuleRef>;
  let mockRepository: jest.Mocked<OrganizationAwareRepository>;

  beforeEach(async () => {
    mockRepository = {
      setOrganizationDb: jest.fn(),
    } as any;

    reflector = {
      get: jest.fn(),
    } as any;

    moduleRef = {
      get: jest.fn().mockReturnValue(mockRepository),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationContextInterceptor,
        {
          provide: Reflector,
          useValue: reflector,
        },
        {
          provide: ModuleRef,
          useValue: moduleRef,
        },
      ],
    }).compile();

    interceptor = module.get<OrganizationContextInterceptor>(
      OrganizationContextInterceptor,
    );
  });

  describe('intercept', () => {
    let mockExecutionContext: jest.Mocked<ExecutionContext>;
    let mockCallHandler: jest.Mocked<CallHandler>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        organization: {
          organizationId: 'org-123',
          schemaName: 'org_123',
          organizationDb: { mockDb: true },
        },
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      } as any;
    });

    it('should set organization context on repositories when organization context exists', () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(moduleRef.get).toHaveBeenCalledWith(POST_REPOSITORY, {
        strict: false,
      });
      expect(mockRepository.setOrganizationDb).toHaveBeenCalledWith({
        mockDb: true,
      });
    });

    it('should not attempt to set organization context when request has no organization', () => {
      mockRequest.organization = undefined;

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(moduleRef.get).not.toHaveBeenCalled();
      expect(mockRepository.setOrganizationDb).not.toHaveBeenCalled();
    });

    it('should handle repository not found gracefully', () => {
      moduleRef.get.mockImplementation(() => {
        throw new Error('Repository not found');
      });

      expect(() =>
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).not.toThrow();

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should handle repositories without setOrganizationDb method', () => {
      moduleRef.get.mockReturnValue({ someOtherMethod: jest.fn() });

      expect(() =>
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).not.toThrow();

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should call next handler after setting organization context', () => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should work with repository in request', () => {
      const mockRepo1 = { setOrganizationDb: jest.fn() };

      moduleRef.get.mockReturnValueOnce(mockRepo1);

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockRepo1.setOrganizationDb).toHaveBeenCalledWith({
        mockDb: true,
      });
    });
  });

  describe('setOrganizationContextOnRepositories', () => {
    it('should attempt to set context on all configured repository tokens', () => {
      const organizationContext = {
        organizationId: 'org-123',
        schemaName: 'org_123',
        organizationDb: { mockDb: true },
      };

      interceptor['setOrganizationContextOnRepositories'](organizationContext);

      expect(moduleRef.get).toHaveBeenCalledTimes(1); // POST
      expect(moduleRef.get).toHaveBeenCalledWith(POST_REPOSITORY, {
        strict: false,
      });
    });
  });
});
