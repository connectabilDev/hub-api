export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export interface GroupMemberProps {
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: Date;
}

export class GroupMember {
  public readonly groupId: string;
  public readonly userId: string;
  public readonly role: GroupMemberRole;
  public readonly joinedAt: Date;

  constructor(props: GroupMemberProps) {
    this.groupId = props.groupId;
    this.userId = props.userId;
    this.role = props.role;
    this.joinedAt = props.joinedAt;
  }

  static create(props: Omit<GroupMemberProps, 'joinedAt'>): GroupMember {
    return new GroupMember({
      ...props,
      joinedAt: new Date(),
    });
  }

  isAdmin(): boolean {
    return this.role === GroupMemberRole.ADMIN;
  }

  isModerator(): boolean {
    return this.role === GroupMemberRole.MODERATOR;
  }

  isOwner(): boolean {
    return this.role === GroupMemberRole.OWNER;
  }

  isMember(): boolean {
    return this.role === GroupMemberRole.MEMBER;
  }

  canInvite(): boolean {
    return [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
      GroupMemberRole.MODERATOR,
    ].includes(this.role);
  }

  canRemoveMember(): boolean {
    return [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
      GroupMemberRole.MODERATOR,
    ].includes(this.role);
  }

  canManageGroup(): boolean {
    return [GroupMemberRole.OWNER, GroupMemberRole.ADMIN].includes(this.role);
  }

  canPromoteMembers(): boolean {
    return this.role === GroupMemberRole.OWNER;
  }

  canModerateContent(): boolean {
    return [
      GroupMemberRole.OWNER,
      GroupMemberRole.ADMIN,
      GroupMemberRole.MODERATOR,
    ].includes(this.role);
  }

  promoteToAdmin(): GroupMember {
    if (this.role === GroupMemberRole.OWNER) {
      return this;
    }

    return new GroupMember({
      ...this,
      role: GroupMemberRole.ADMIN,
    });
  }

  promoteToModerator(): GroupMember {
    if ([GroupMemberRole.OWNER, GroupMemberRole.ADMIN].includes(this.role)) {
      return this;
    }

    return new GroupMember({
      ...this,
      role: GroupMemberRole.MODERATOR,
    });
  }

  demoteToMember(): GroupMember {
    if (this.role === GroupMemberRole.OWNER) {
      return this;
    }

    return new GroupMember({
      ...this,
      role: GroupMemberRole.MEMBER,
    });
  }

  hasHigherRoleThan(otherMember: GroupMember): boolean {
    const roleHierarchy = {
      [GroupMemberRole.OWNER]: 4,
      [GroupMemberRole.ADMIN]: 3,
      [GroupMemberRole.MODERATOR]: 2,
      [GroupMemberRole.MEMBER]: 1,
    };

    return roleHierarchy[this.role] > roleHierarchy[otherMember.role];
  }

  toJSON(): object {
    return {
      groupId: this.groupId,
      userId: this.userId,
      role: this.role,
      joinedAt: this.joinedAt.toISOString(),
    };
  }
}
