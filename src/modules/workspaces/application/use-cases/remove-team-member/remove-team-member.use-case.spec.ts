import { Test, TestingModule } from '@nestjs/testing';
import { RemoveTeamMemberUseCase } from './remove-team-member.use-case';
import { RemoveTeamMemberDto } from './remove-team-member.dto';
import { WORKSPACE_REPOSITORY } from '../../../domain/repositories/workspace.repository.interface';
import { WORKSPACE_MEMBER_REPOSITORY } from '../../../domain/repositories/workspace-member.repository.interface';
import {
  Workspace,
  WorkspaceType,
} from '../../../domain/entities/workspace.entity';
import { WorkspaceMember } from '../../../domain/entities/workspace-member.entity';
import { WorkspaceRole } from '../../../domain/entities/workspace.entity';
import {
  WorkspaceNotFoundError,
  WorkspaceMemberNotFoundError,
  InsufficientWorkspacePermissionsError,
} from '../../../domain/errors/workspace.errors';

describe('RemoveTeamMemberUseCase', () => {
  let useCase: RemoveTeamMemberUseCase;
  let workspaceRepository: any;
  let workspaceMemberRepository: any;

  const mockWorkspace = Workspace.create({
    organizationId: 'org-123',
    ownerId: 'owner-123',
    name: 'Test Workspace',
    type: WorkspaceType.PROFESSOR,
    description: 'Test workspace',
  });

  const mockOwnerMember = WorkspaceMember.create({
    workspaceId: mockWorkspace.id,
    userId: 'owner-123',
    role: WorkspaceRole.OWNER,
    invitedBy: 'system',
    invitedAt: new Date(),
  });

  const mockMemberToRemove = WorkspaceMember.create({
    workspaceId: mockWorkspace.id,
    userId: 'member-456',
    role: WorkspaceRole.ASSISTANT,
    invitedBy: 'owner-123',
    invitedAt: new Date(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTeamMemberUseCase,
        {
          provide: WORKSPACE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: WORKSPACE_MEMBER_REPOSITORY,
          useValue: {
            findByWorkspaceAndUser: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RemoveTeamMemberUseCase>(RemoveTeamMemberUseCase);
    workspaceRepository = module.get(WORKSPACE_REPOSITORY);
    workspaceMemberRepository = module.get(WORKSPACE_MEMBER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const dto: RemoveTeamMemberDto = {
      workspaceId: mockWorkspace.id,
      memberId: 'member-456',
      removedBy: 'owner-123',
    };

    it('should successfully remove a team member', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(mockOwnerMember)
        .mockResolvedValueOnce(mockMemberToRemove);
      workspaceMemberRepository.delete.mockResolvedValue(undefined);

      await useCase.execute(dto);

      expect(workspaceRepository.findById).toHaveBeenCalledWith(
        dto.workspaceId,
      );
      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).toHaveBeenCalledWith(dto.workspaceId, dto.removedBy);
      expect(
        workspaceMemberRepository.findByWorkspaceAndUser,
      ).toHaveBeenCalledWith(dto.workspaceId, dto.memberId);
      expect(workspaceMemberRepository.delete).toHaveBeenCalledWith(
        dto.workspaceId,
        dto.memberId,
      );
    });

    it('should throw WorkspaceNotFoundError if workspace does not exist', async () => {
      workspaceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        WorkspaceNotFoundError,
      );
    });

    it('should throw InsufficientWorkspacePermissionsError if remover does not have permission', async () => {
      const regularMember = WorkspaceMember.create({
        workspaceId: mockWorkspace.id,
        userId: 'regular-789',
        role: WorkspaceRole.MODERATOR,
        invitedBy: 'owner-123',
        invitedAt: new Date(),
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
        regularMember,
      );

      await expect(
        useCase.execute({ ...dto, removedBy: 'regular-789' }),
      ).rejects.toThrow(InsufficientWorkspacePermissionsError);
    });

    it('should throw WorkspaceMemberNotFoundError if member to remove does not exist', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(mockOwnerMember)
        .mockResolvedValueOnce(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        WorkspaceMemberNotFoundError,
      );
    });

    it('should throw InsufficientWorkspacePermissionsError when trying to remove workspace owner', async () => {
      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(mockOwnerMember)
        .mockResolvedValueOnce(mockOwnerMember);

      await expect(
        useCase.execute({
          ...dto,
          memberId: 'owner-123',
        }),
      ).rejects.toThrow(InsufficientWorkspacePermissionsError);
    });

    it('should allow co-professor to remove members in professor workspace', async () => {
      const coProfessor = WorkspaceMember.create({
        workspaceId: mockWorkspace.id,
        userId: 'co-prof-123',
        role: WorkspaceRole.CO_PROFESSOR,
        invitedBy: 'owner-123',
        invitedAt: new Date(),
      });

      workspaceRepository.findById.mockResolvedValue(mockWorkspace);
      workspaceMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(coProfessor)
        .mockResolvedValueOnce(mockMemberToRemove);
      workspaceMemberRepository.delete.mockResolvedValue(undefined);

      await useCase.execute({ ...dto, removedBy: 'co-prof-123' });

      expect(workspaceMemberRepository.delete).toHaveBeenCalledWith(
        dto.workspaceId,
        dto.memberId,
      );
    });
  });
});
