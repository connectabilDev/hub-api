import { WorkspaceRole } from './workspace.entity';

export interface WorkspaceMemberProps {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt: Date;
  isActive: boolean;
}

export class WorkspaceMember {
  public readonly id: string;
  public readonly workspaceId: string;
  public readonly userId: string;
  public readonly role: WorkspaceRole;
  public readonly invitedBy?: string;
  public readonly invitedAt?: Date;
  public readonly joinedAt: Date;
  public readonly isActive: boolean;

  constructor(props: WorkspaceMemberProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.role = props.role;
    this.invitedBy = props.invitedBy;
    this.invitedAt = props.invitedAt;
    this.joinedAt = props.joinedAt;
    this.isActive = props.isActive;
  }

  static create(
    props: Omit<WorkspaceMemberProps, 'id' | 'joinedAt' | 'isActive'>,
  ): WorkspaceMember {
    return new WorkspaceMember({
      ...props,
      id: crypto.randomUUID(),
      joinedAt: new Date(),
      isActive: true,
    });
  }

  isOwner(): boolean {
    return this.role === WorkspaceRole.OWNER;
  }

  canManageContent(): boolean {
    return [
      WorkspaceRole.OWNER,
      WorkspaceRole.ASSISTANT,
      WorkspaceRole.CO_PROFESSOR,
      WorkspaceRole.CO_MENTOR,
    ].includes(this.role);
  }

  canModerate(): boolean {
    return [WorkspaceRole.OWNER, WorkspaceRole.MODERATOR].includes(this.role);
  }

  canInviteMembers(): boolean {
    return this.role === WorkspaceRole.OWNER;
  }

  canManageJobs(): boolean {
    return [
      WorkspaceRole.OWNER,
      WorkspaceRole.RECRUITER,
      WorkspaceRole.HIRING_MANAGER,
    ].includes(this.role);
  }

  canAnalyzeData(): boolean {
    return [WorkspaceRole.OWNER, WorkspaceRole.HR_ANALYST].includes(this.role);
  }
}
