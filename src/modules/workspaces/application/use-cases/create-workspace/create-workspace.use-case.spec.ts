import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';
import { CreateWorkspaceDto } from './create-workspace.dto';
import {
  Workspace,
  WorkspaceType,
  WorkspaceRole,
} from '../../../domain/entities/workspace.entity';
import { WorkspaceMember } from '../../../domain/entities/workspace-member.entity';
import {
  WorkspaceRepositoryInterface,
  WORKSPACE_REPOSITORY,
} from '../../../domain/repositories/workspace.repository.interface';
import {
  WorkspaceMemberRepositoryInterface,
  WORKSPACE_MEMBER_REPOSITORY,
} from '../../../domain/repositories/workspace-member.repository.interface';
import { WorkspaceAlreadyExistsError } from '../../../domain/errors/workspace.errors';

describe('CreateWorkspaceUseCase', () => {
  let useCase: CreateWorkspaceUseCase;
  let workspaceRepository: jest.Mocked<WorkspaceRepositoryInterface>;
  let workspaceMemberRepository: jest.Mocked<WorkspaceMemberRepositoryInterface>;

  beforeEach(async () => {
    const mockWorkspaceRepository = {
      save: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByOrganizationId: jest.fn(),
      findByOwnerId: jest.fn(),
      findByOwnerIdAndType: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockWorkspaceMemberRepository = {
      save: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByWorkspaceId: jest.fn(),
      findByUserId: jest.fn(),
      findByWorkspaceAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceUseCase,
        {
          provide: WORKSPACE_REPOSITORY,
          useValue: mockWorkspaceRepository,
        },
        {
          provide: WORKSPACE_MEMBER_REPOSITORY,
          useValue: mockWorkspaceMemberRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateWorkspaceUseCase>(CreateWorkspaceUseCase);
    workspaceRepository = module.get(WORKSPACE_REPOSITORY);
    workspaceMemberRepository = module.get(WORKSPACE_MEMBER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const createWorkspaceDto: CreateWorkspaceDto = {
      organizationId: 'org-123',
      ownerId: 'user-123',
      ownerName: 'John Professor',
      type: WorkspaceType.PROFESSOR,
    };

    it('should create a workspace successfully for PROFESSOR type', async () => {
      const mockWorkspace = Workspace.create({
        organizationId: createWorkspaceDto.organizationId,
        ownerId: createWorkspaceDto.ownerId,
        name: "Professor John Professor's Teaching Team",
        type: createWorkspaceDto.type,
        description: 'Teaching team workspace for Professor John Professor',
      });

      const mockOwnerMember = WorkspaceMember.create({
        workspaceId: mockWorkspace.id,
        userId: createWorkspaceDto.ownerId,
        role: WorkspaceRole.OWNER,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(mockOwnerMember);

      const result = await useCase.execute(createWorkspaceDto);

      expect(workspaceRepository.findByOwnerId).toHaveBeenCalledWith(
        createWorkspaceDto.ownerId,
      );
      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: createWorkspaceDto.organizationId,
          ownerId: createWorkspaceDto.ownerId,
          name: expect.stringContaining('John Professor'),
          type: createWorkspaceDto.type,
        }),
      );
      expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspace.id,
          userId: createWorkspaceDto.ownerId,
          role: WorkspaceRole.OWNER,
        }),
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('should create a workspace successfully for MENTOR type', async () => {
      const mentorDto: CreateWorkspaceDto = {
        ...createWorkspaceDto,
        ownerName: 'Jane Mentor',
        type: WorkspaceType.MENTOR,
      };

      const mockWorkspace = Workspace.create({
        organizationId: mentorDto.organizationId,
        ownerId: mentorDto.ownerId,
        name: "Jane Mentor's Mentoring Team",
        type: mentorDto.type,
        description: 'Mentoring team workspace for Jane Mentor',
      });

      const mockOwnerMember = WorkspaceMember.create({
        workspaceId: mockWorkspace.id,
        userId: mentorDto.ownerId,
        role: WorkspaceRole.OWNER,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(mockOwnerMember);

      const result = await useCase.execute(mentorDto);

      expect(workspaceRepository.findByOwnerId).toHaveBeenCalledWith(
        mentorDto.ownerId,
      );
      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WorkspaceType.MENTOR,
          name: expect.stringContaining('Jane Mentor'),
        }),
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('should create a workspace successfully for EMPLOYER type', async () => {
      const employerDto: CreateWorkspaceDto = {
        ...createWorkspaceDto,
        ownerName: 'Company HR',
        type: WorkspaceType.EMPLOYER,
      };

      const mockWorkspace = Workspace.create({
        organizationId: employerDto.organizationId,
        ownerId: employerDto.ownerId,
        name: "Company HR's Hiring Team",
        type: employerDto.type,
        description: 'Hiring team workspace for Company HR',
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(
        expect.any(WorkspaceMember),
      );

      const result = await useCase.execute(employerDto);

      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WorkspaceType.EMPLOYER,
          name: expect.stringContaining('Company HR'),
        }),
      );
      expect(result).toEqual(mockWorkspace);
    });

    it('should use custom description when provided', async () => {
      const dtoWithDescription: CreateWorkspaceDto = {
        ...createWorkspaceDto,
        description: 'Custom workspace description',
      };

      const mockWorkspace = Workspace.create({
        organizationId: dtoWithDescription.organizationId,
        ownerId: dtoWithDescription.ownerId,
        name: "Professor John Professor's Teaching Team",
        type: dtoWithDescription.type,
        description: dtoWithDescription.description,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(
        expect.any(WorkspaceMember),
      );

      await useCase.execute(dtoWithDescription);

      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom workspace description',
        }),
      );
    });

    it('should create owner member with correct properties', async () => {
      const mockWorkspace = Workspace.create({
        organizationId: createWorkspaceDto.organizationId,
        ownerId: createWorkspaceDto.ownerId,
        name: "Professor John Professor's Teaching Team",
        type: createWorkspaceDto.type,
      });

      const mockOwnerMember = WorkspaceMember.create({
        workspaceId: mockWorkspace.id,
        userId: createWorkspaceDto.ownerId,
        role: WorkspaceRole.OWNER,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(mockOwnerMember);

      await useCase.execute(createWorkspaceDto);

      expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspace.id,
          userId: createWorkspaceDto.ownerId,
          role: WorkspaceRole.OWNER,
          isActive: true,
        }),
      );
    });

    it('should throw WorkspaceAlreadyExistsError when workspace of same type already exists', async () => {
      const existingWorkspace = Workspace.create({
        organizationId: 'org-456',
        ownerId: createWorkspaceDto.ownerId,
        name: 'Existing Workspace',
        type: WorkspaceType.PROFESSOR,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([existingWorkspace]);

      await expect(useCase.execute(createWorkspaceDto)).rejects.toThrow(
        WorkspaceAlreadyExistsError,
      );

      expect(workspaceRepository.findByOwnerId).toHaveBeenCalledWith(
        createWorkspaceDto.ownerId,
      );
      expect(workspaceRepository.create).not.toHaveBeenCalled();
      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should allow creating workspace of different type for same owner', async () => {
      const existingWorkspace = Workspace.create({
        organizationId: 'org-456',
        ownerId: createWorkspaceDto.ownerId,
        name: 'Existing Mentor Workspace',
        type: WorkspaceType.MENTOR,
      });

      const mockNewWorkspace = Workspace.create({
        organizationId: createWorkspaceDto.organizationId,
        ownerId: createWorkspaceDto.ownerId,
        name: "Professor John Professor's Teaching Team",
        type: WorkspaceType.PROFESSOR,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([existingWorkspace]);
      workspaceRepository.create.mockResolvedValue(mockNewWorkspace);
      workspaceMemberRepository.create.mockResolvedValue(
        expect.any(WorkspaceMember),
      );

      const result = await useCase.execute(createWorkspaceDto);

      expect(workspaceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WorkspaceType.PROFESSOR,
        }),
      );
      expect(result).toEqual(mockNewWorkspace);
    });

    it('should handle repository errors gracefully', async () => {
      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(createWorkspaceDto)).rejects.toThrow(
        'Database error',
      );

      expect(workspaceRepository.findByOwnerId).toHaveBeenCalledWith(
        createWorkspaceDto.ownerId,
      );
      expect(workspaceRepository.create).toHaveBeenCalled();
      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should handle workspace member creation errors gracefully', async () => {
      const mockWorkspace = Workspace.create({
        organizationId: createWorkspaceDto.organizationId,
        ownerId: createWorkspaceDto.ownerId,
        name: "Professor John Professor's Teaching Team",
        type: createWorkspaceDto.type,
      });

      workspaceRepository.findByOwnerId.mockResolvedValue([]);
      workspaceRepository.create.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.create.mockRejectedValue(
        new Error('Member creation failed'),
      );

      await expect(useCase.execute(createWorkspaceDto)).rejects.toThrow(
        'Member creation failed',
      );

      expect(workspaceRepository.create).toHaveBeenCalled();
      expect(workspaceMemberRepository.create).toHaveBeenCalled();
    });
  });
});
