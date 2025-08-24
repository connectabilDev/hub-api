import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AutoCreateWorkspaceUseCase } from './auto-create-workspace.use-case';
import { CreateWorkspaceUseCase } from '../create-workspace/create-workspace.use-case';
import { CreateWorkspaceDto } from '../create-workspace/create-workspace.dto';
import { UserRole } from '../../../../auth/domain/entities/user.entity';
import {
  Workspace,
  WorkspaceType,
} from '../../../domain/entities/workspace.entity';
import { WorkspaceAlreadyExistsError } from '../../../domain/errors/workspace.errors';

describe('AutoCreateWorkspaceUseCase', () => {
  let useCase: AutoCreateWorkspaceUseCase;
  let createWorkspaceUseCase: jest.Mocked<CreateWorkspaceUseCase>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockCreateWorkspaceUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoCreateWorkspaceUseCase,
        {
          provide: CreateWorkspaceUseCase,
          useValue: mockCreateWorkspaceUseCase,
        },
      ],
    }).compile();

    useCase = module.get<AutoCreateWorkspaceUseCase>(
      AutoCreateWorkspaceUseCase,
    );
    createWorkspaceUseCase = module.get(CreateWorkspaceUseCase);

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    Object.defineProperty(useCase, 'logger', {
      value: logger,
      writable: true,
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('executeForRoleAssignment', () => {
    const baseParams = {
      userId: 'user-123',
      userName: 'John Doe',
      organizationId: 'org-123',
    };

    describe('PROFESSOR role', () => {
      it('should create PROFESSOR workspace for PROFESSOR role', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Teaching Team",
          type: WorkspaceType.PROFESSOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: baseParams.organizationId,
            ownerId: baseParams.userId,
            ownerName: baseParams.userName,
            type: WorkspaceType.PROFESSOR,
          }),
        );
        expect(logger.log).toHaveBeenCalledWith(
          `Auto-created ${WorkspaceType.PROFESSOR} workspace for user ${baseParams.userId} with role ${UserRole.PROFESSOR}`,
        );
      });

      it('should handle WorkspaceAlreadyExistsError gracefully for PROFESSOR', async () => {
        const workspaceError = new WorkspaceAlreadyExistsError(
          baseParams.userId,
          WorkspaceType.PROFESSOR,
        );
        createWorkspaceUseCase.execute.mockRejectedValue(workspaceError);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(
          `Workspace already exists for user ${baseParams.userId} with type ${WorkspaceType.PROFESSOR}`,
        );
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('MENTOR role', () => {
      it('should create MENTOR workspace for MENTOR role', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Mentoring Team",
          type: WorkspaceType.MENTOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.MENTOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: baseParams.organizationId,
            ownerId: baseParams.userId,
            ownerName: baseParams.userName,
            type: WorkspaceType.MENTOR,
          }),
        );
        expect(logger.log).toHaveBeenCalledWith(
          `Auto-created ${WorkspaceType.MENTOR} workspace for user ${baseParams.userId} with role ${UserRole.MENTOR}`,
        );
      });

      it('should handle WorkspaceAlreadyExistsError gracefully for MENTOR', async () => {
        const workspaceError = new WorkspaceAlreadyExistsError(
          baseParams.userId,
          WorkspaceType.MENTOR,
        );
        createWorkspaceUseCase.execute.mockRejectedValue(workspaceError);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.MENTOR,
          baseParams.organizationId,
        );

        expect(logger.log).toHaveBeenCalledWith(
          `Workspace already exists for user ${baseParams.userId} with type ${WorkspaceType.MENTOR}`,
        );
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('EMPLOYER role', () => {
      it('should create EMPLOYER workspace for EMPLOYER role', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Hiring Team",
          type: WorkspaceType.EMPLOYER,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.EMPLOYER,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: baseParams.organizationId,
            ownerId: baseParams.userId,
            ownerName: baseParams.userName,
            type: WorkspaceType.EMPLOYER,
          }),
        );
        expect(logger.log).toHaveBeenCalledWith(
          `Auto-created ${WorkspaceType.EMPLOYER} workspace for user ${baseParams.userId} with role ${UserRole.EMPLOYER}`,
        );
      });

      it('should handle WorkspaceAlreadyExistsError gracefully for EMPLOYER', async () => {
        const workspaceError = new WorkspaceAlreadyExistsError(
          baseParams.userId,
          WorkspaceType.EMPLOYER,
        );
        createWorkspaceUseCase.execute.mockRejectedValue(workspaceError);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.EMPLOYER,
          baseParams.organizationId,
        );

        expect(logger.log).toHaveBeenCalledWith(
          `Workspace already exists for user ${baseParams.userId} with type ${WorkspaceType.EMPLOYER}`,
        );
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('Non-workspace requiring roles', () => {
      it('should not create workspace for CANDIDATE role', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.CANDIDATE,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(
          `Role ${UserRole.CANDIDATE} does not require a workspace`,
        );
      });

      it('should not create workspace for USER role', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.USER,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(
          `Role ${UserRole.USER} does not require a workspace`,
        );
      });

      it('should not create workspace for ADMIN role', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.ADMIN,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(
          `Role ${UserRole.ADMIN} does not require a workspace`,
        );
      });
    });

    describe('Missing organization ID', () => {
      it('should not create workspace when organizationId is undefined', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          undefined,
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          'No organization ID provided for workspace creation',
        );
      });

      it('should not create workspace when organizationId is null', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.MENTOR,
          null as any,
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          'No organization ID provided for workspace creation',
        );
      });

      it('should not create workspace when organizationId is empty string', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.EMPLOYER,
          '',
        );

        expect(createWorkspaceUseCase.execute).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          'No organization ID provided for workspace creation',
        );
      });
    });

    describe('Error handling', () => {
      it('should log and rethrow non-WorkspaceAlreadyExistsError errors', async () => {
        const genericError = new Error('Database connection failed');
        createWorkspaceUseCase.execute.mockRejectedValue(genericError);

        await expect(
          useCase.executeForRoleAssignment(
            baseParams.userId,
            baseParams.userName,
            UserRole.PROFESSOR,
            baseParams.organizationId,
          ),
        ).rejects.toThrow('Database connection failed');

        expect(logger.error).toHaveBeenCalledWith(
          `Failed to auto-create workspace for user ${baseParams.userId}`,
          genericError,
        );
      });

      it('should handle validation errors during workspace creation', async () => {
        const validationError = new Error('Invalid workspace configuration');
        createWorkspaceUseCase.execute.mockRejectedValue(validationError);

        await expect(
          useCase.executeForRoleAssignment(
            baseParams.userId,
            baseParams.userName,
            UserRole.MENTOR,
            baseParams.organizationId,
          ),
        ).rejects.toThrow('Invalid workspace configuration');

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: WorkspaceType.MENTOR,
          }),
        );
        expect(logger.error).toHaveBeenCalled();
      });

      it('should handle timeout errors gracefully', async () => {
        const timeoutError = new Error('Request timeout');
        createWorkspaceUseCase.execute.mockRejectedValue(timeoutError);

        await expect(
          useCase.executeForRoleAssignment(
            baseParams.userId,
            baseParams.userName,
            UserRole.EMPLOYER,
            baseParams.organizationId,
          ),
        ).rejects.toThrow('Request timeout');

        expect(logger.error).toHaveBeenCalledWith(
          `Failed to auto-create workspace for user ${baseParams.userId}`,
          timeoutError,
        );
      });
    });

    describe('Role to workspace type mapping', () => {
      it('should correctly map PROFESSOR role to PROFESSOR workspace type', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Teaching Team",
          type: WorkspaceType.PROFESSOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: WorkspaceType.PROFESSOR,
          }),
        );
      });

      it('should correctly map MENTOR role to MENTOR workspace type', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Mentoring Team",
          type: WorkspaceType.MENTOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.MENTOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: WorkspaceType.MENTOR,
          }),
        );
      });

      it('should correctly map EMPLOYER role to EMPLOYER workspace type', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Hiring Team",
          type: WorkspaceType.EMPLOYER,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.EMPLOYER,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            type: WorkspaceType.EMPLOYER,
          }),
        );
      });
    });

    describe('DTO creation', () => {
      it('should create CreateWorkspaceDto with correct parameters', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Teaching Team",
          type: WorkspaceType.PROFESSOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          baseParams.organizationId,
        );

        expect(createWorkspaceUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: baseParams.organizationId,
            ownerId: baseParams.userId,
            ownerName: baseParams.userName,
            type: WorkspaceType.PROFESSOR,
          }),
        );

        const calledDto = createWorkspaceUseCase.execute.mock.calls[0][0];
        expect(calledDto).toBeInstanceOf(CreateWorkspaceDto);
      });

      it('should not include description in DTO when auto-creating', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Mentoring Team",
          type: WorkspaceType.MENTOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.MENTOR,
          baseParams.organizationId,
        );

        const calledDto = createWorkspaceUseCase.execute.mock.calls[0][0];
        expect(calledDto.description).toBeUndefined();
      });
    });

    describe('Logging behavior', () => {
      it('should log workspace creation attempt', async () => {
        const mockWorkspace = Workspace.create({
          organizationId: baseParams.organizationId,
          ownerId: baseParams.userId,
          name: "John Doe's Teaching Team",
          type: WorkspaceType.PROFESSOR,
        });

        createWorkspaceUseCase.execute.mockResolvedValue(mockWorkspace);

        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          baseParams.organizationId,
        );

        expect(logger.log).toHaveBeenCalledWith(
          `Auto-created ${WorkspaceType.PROFESSOR} workspace for user ${baseParams.userId} with role ${UserRole.PROFESSOR}`,
        );
      });

      it('should log when role does not require workspace', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.CANDIDATE,
          baseParams.organizationId,
        );

        expect(logger.log).toHaveBeenCalledWith(
          `Role ${UserRole.CANDIDATE} does not require a workspace`,
        );
      });

      it('should warn when organization ID is missing', async () => {
        await useCase.executeForRoleAssignment(
          baseParams.userId,
          baseParams.userName,
          UserRole.PROFESSOR,
          undefined,
        );

        expect(logger.warn).toHaveBeenCalledWith(
          'No organization ID provided for workspace creation',
        );
      });
    });
  });
});
