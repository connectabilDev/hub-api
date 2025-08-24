import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';

export class WorkspaceMemberResponseDto {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt: Date;
  isActive: boolean;

  constructor(data: Partial<WorkspaceMemberResponseDto>) {
    Object.assign(this, data);
  }
}

export class WorkspaceMemberMapper {
  static toResponseDto(member: WorkspaceMember): WorkspaceMemberResponseDto {
    return new WorkspaceMemberResponseDto({
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      invitedBy: member.invitedBy,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
    });
  }

  static toResponseDtoList(
    members: WorkspaceMember[],
  ): WorkspaceMemberResponseDto[] {
    return members.map((member) => this.toResponseDto(member));
  }
}
