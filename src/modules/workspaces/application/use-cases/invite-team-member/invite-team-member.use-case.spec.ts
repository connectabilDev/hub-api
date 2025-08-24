import { Test, TestingModule } from '@nestjs/testing';
import { InviteTeamMemberUseCase } from './invite-team-member.use-case';
import { InviteTeamMemberDto } from './invite-team-member.dto';
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
import {
  WorkspaceNotFoundError,
  InvalidWorkspaceRoleError,
  WorkspaceMemberAlreadyExistsError,
  InsufficientWorkspacePermissionsError,
} from '../../../domain/errors/workspace.errors';

describe('InviteTeamMemberUseCase', () => {
  let useCase: InviteTeamMemberUseCase;
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
        InviteTeamMemberUseCase,
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

    useCase = module.get<InviteTeamMemberUseCase>(InviteTeamMemberUseCase);
    workspaceRepository = module.get(WORKSPACE_REPOSITORY);
    workspaceMemberRepository = module.get(WORKSPACE_MEMBER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const inviteTeamMemberDto: InviteTeamMemberDto = {
      workspaceId: 'workspace-123',
      inviterId: 'owner-123',
      inviteeId: 'invitee-123',
      inviteeEmail: 'invitee@example.com',
      role: WorkspaceRole.ASSISTANT,
    };

    const mockWorkspace = Workspace.create({
      organizationId: 'org-123',
      ownerId: 'owner-123',
      name: "Professor's Teaching Team",
      type: WorkspaceType.PROFESSOR,
    });

    const mockInviterMember = WorkspaceMember.create({
      workspaceId: 'workspace-123',
      userId: 'owner-123',
      role: WorkspaceRole.OWNER,
    });

    it('should successfully invite a team member with valid role for PROFESSOR workspace', async () => {
      const mockInvitedMember = WorkspaceMember.create({
        workspaceId: inviteTeamMemberDto.workspaceId,
        userId: inviteTeamMemberDto.inviteeId,
        role: inviteTeamMemberDto.role,
        invitedBy: inviteTeamMemberDto.inviterId,
        invitedAt: expect.any(Date),
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockResolvedValue(mockInvitedMember);

      const result = await useCase.execute(inviteTeamMemberDto);

      expect(workspaceRepository.findById).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
      );
      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
        inviteTeamMemberDto.inviterId,
      );
      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
        inviteTeamMemberDto.inviteeId,
      );
      expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: inviteTeamMemberDto.workspaceId,
          userId: inviteTeamMemberDto.inviteeId,
          role: inviteTeamMemberDto.role,
          invitedBy: inviteTeamMemberDto.inviterId,
          invitedAt: expect.any(Date),
        }),
      );
      expect(result).toEqual(mockInvitedMember);
    });

    it('should invite CO_PROFESSOR to PROFESSOR workspace', async () => {
      const coProfessorDto: InviteTeamMemberDto = {
        ...inviteTeamMemberDto,
        role: WorkspaceRole.CO_PROFESSOR,
      };

      const mockInvitedMember = WorkspaceMember.create({
        workspaceId: coProfessorDto.workspaceId,
        userId: coProfessorDto.inviteeId,
        role: WorkspaceRole.CO_PROFESSOR,
        invitedBy: coProfessorDto.inviterId,
        invitedAt: expect.any(Date),
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockResolvedValue(mockInvitedMember);

      const result = await useCase.execute(coProfessorDto);

      expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: WorkspaceRole.CO_PROFESSOR,
        }),
      );
      expect(result).toEqual(mockInvitedMember);
    });

    it('should invite CO_MENTOR to MENTOR workspace', async () => {
      const mentorWorkspace = Workspace.create({
        organizationId: 'org-123',
        ownerId: 'owner-123',
        name: "Mentor's Team",
        type: WorkspaceType.MENTOR,
      });

      const mentorDto: InviteTeamMemberDto = {
        ...inviteTeamMemberDto,
        role: WorkspaceRole.CO_MENTOR,
      };

      const mockInvitedMember = WorkspaceMember.create({
        workspaceId: mentorDto.workspaceId,
        userId: mentorDto.inviteeId,
        role: WorkspaceRole.CO_MENTOR,
        invitedBy: mentorDto.inviterId,
        invitedAt: expect.any(Date),
      });

      workspaceRepository.findById.mockResolvedValue(mentorWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockResolvedValue(mockInvitedMember);

      const result = await useCase.execute(mentorDto);

      expect(result.role).toBe(WorkspaceRole.CO_MENTOR);
    });

    it('should invite RECRUITER to EMPLOYER workspace', async () => {
      const employerWorkspace = Workspace.create({
        organizationId: 'org-123',
        ownerId: 'owner-123',
        name: "Company's Hiring Team",
        type: WorkspaceType.EMPLOYER,
      });

      const recruiterDto: InviteTeamMemberDto = {
        ...inviteTeamMemberDto,
        role: WorkspaceRole.RECRUITER,
      };

      const mockInvitedMember = WorkspaceMember.create({
        workspaceId: recruiterDto.workspaceId,
        userId: recruiterDto.inviteeId,
        role: WorkspaceRole.RECRUITER,
        invitedBy: recruiterDto.inviterId,
        invitedAt: expect.any(Date),
      });

      workspaceRepository.findById.mockResolvedValue(employerWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockResolvedValue(mockInvitedMember);

      const result = await useCase.execute(recruiterDto);

      expect(result.role).toBe(WorkspaceRole.RECRUITER);
    });

    it('should throw WorkspaceNotFoundError when workspace does not exist', async () => {
      workspaceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        WorkspaceNotFoundError,
      );

      expect(workspaceRepository.findById).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
      );
      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).not.toHaveBeenCalled();
      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InsufficientWorkspacePermissionsError when inviter is not a member', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        InsufficientWorkspacePermissionsError,
      );

      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
        inviteTeamMemberDto.inviterId,
      );
      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InsufficientWorkspacePermissionsError when inviter cannot invite members', async () => {
      const nonOwnerMember = WorkspaceMember.create({
        workspaceId: 'workspace-123',
        userId: 'inviter-123',
        role: WorkspaceRole.ASSISTANT,
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        nonOwnerMember,
      );

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        InsufficientWorkspacePermissionsError,
      );

      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidWorkspaceRoleError when role is not allowed for workspace type', async () => {
      const invalidRoleDto: InviteTeamMemberDto = {
        ...inviteTeamMemberDto,
        role: WorkspaceRole.RECRUITER,
      };

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );

      await expect(useCase.execute(invalidRoleDto)).rejects.toThrow(
        InvalidWorkspaceRoleError,
      );

      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should throw WorkspaceMemberAlreadyExistsError when invitee is already a member', async () => {
      const existingMember = WorkspaceMember.create({
        workspaceId: 'workspace-123',
        userId: inviteTeamMemberDto.inviteeId,
        role: WorkspaceRole.MODERATOR,
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        existingMember,
      );

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        WorkspaceMemberAlreadyExistsError,
      );

      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during workspace retrieval', async () => {
      workspaceRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        'Database connection failed',
      );

      expect(workspaceRepository.findById).toHaveBeenCalledWith(
        inviteTeamMemberDto.workspaceId,
      );
      expect(workspaceMemberRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during member creation', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockRejectedValue(
        new Error('Failed to create member'),
      );

      await expect(useCase.execute(inviteTeamMemberDto)).rejects.toThrow(
        'Failed to create member',
      );

      expect(workspaceMemberRepository.create).toHaveBeenCalled();
    });

    it('should set correct invitation metadata', async () => {
      const mockInvitedMember = WorkspaceMember.create({
        workspaceId: inviteTeamMemberDto.workspaceId,
        userId: inviteTeamMemberDto.inviteeId,
        role: inviteTeamMemberDto.role,
        invitedBy: inviteTeamMemberDto.inviterId,
        invitedAt: new Date(),
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        mockInviterMember,
      );
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        null,
      );
      workspaceMemberRepository.create.mockResolvedValue(mockInvitedMember);

      await useCase.execute(inviteTeamMemberDto);

      expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invitedBy: inviteTeamMemberDto.inviterId,
          invitedAt: expect.any(Date),
          isActive: true,
        }),
      );
    });

    it('should validate all allowed roles for PROFESSOR workspace', async () => {
      const professorWorkspace = Workspace.create({
        organizationId: 'org-123',
        ownerId: 'owner-123',
        name: "Professor's Teaching Team",
        type: WorkspaceType.PROFESSOR,
      });

      const allowedRoles = [
        WorkspaceRole.ASSISTANT,
        WorkspaceRole.MODERATOR,
        WorkspaceRole.CO_PROFESSOR,
      ];

      workspaceRepository.findById.mockResolvedValue(professorWorkspace);

      for (const role of allowedRoles) {
        workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
          mockInviterMember,
        );
        workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
          null,
        );
        workspaceMemberRepository.create.mockResolvedValue(
          WorkspaceMember.create({
            workspaceId: inviteTeamMemberDto.workspaceId,
            userId: inviteTeamMemberDto.inviteeId,
            role,
            invitedBy: inviteTeamMemberDto.inviterId,
          }),
        );

        const dto: InviteTeamMemberDto = { ...inviteTeamMemberDto, role };
        const result = await useCase.execute(dto);

        expect(result.role).toBe(role);
      }
    });

    it('should validate all allowed roles for EMPLOYER workspace', async () => {
      const employerWorkspace = Workspace.create({
        organizationId: 'org-123',
        ownerId: 'owner-123',
        name: "Company's Hiring Team",
        type: WorkspaceType.EMPLOYER,
      });

      const allowedRoles = [
        WorkspaceRole.RECRUITER,
        WorkspaceRole.HR_ANALYST,
        WorkspaceRole.HIRING_MANAGER,
      ];

      workspaceRepository.findById.mockResolvedValue(employerWorkspace);

      for (const role of allowedRoles) {
        workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
          mockInviterMember,
        );
        workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
          null,
        );
        workspaceMemberRepository.create.mockResolvedValue(
          WorkspaceMember.create({
            workspaceId: inviteTeamMemberDto.workspaceId,
            userId: inviteTeamMemberDto.inviteeId,
            role,
            invitedBy: inviteTeamMemberDto.inviterId,
          }),
        );

        const dto: InviteTeamMemberDto = { ...inviteTeamMemberDto, role };
        const result = await useCase.execute(dto);

        expect(result.role).toBe(role);
      }
    });
  });
});
