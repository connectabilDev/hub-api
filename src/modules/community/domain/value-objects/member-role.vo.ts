export enum MemberRoleType {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum Permission {
  DELETE_GROUP = 'DELETE_GROUP',
  EDIT_GROUP_SETTINGS = 'EDIT_GROUP_SETTINGS',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  REMOVE_MEMBERS = 'REMOVE_MEMBERS',
  APPROVE_POSTS = 'APPROVE_POSTS',
  DELETE_POSTS = 'DELETE_POSTS',
  PIN_POSTS = 'PIN_POSTS',
  CREATE_POSTS = 'CREATE_POSTS',
  COMMENT_POSTS = 'COMMENT_POSTS',
  VIEW_CONTENT = 'VIEW_CONTENT',
}

export class MemberRole {
  private static readonly ROLE_HIERARCHY: Record<MemberRoleType, number> = {
    [MemberRoleType.MEMBER]: 1,
    [MemberRoleType.MODERATOR]: 2,
    [MemberRoleType.ADMIN]: 3,
    [MemberRoleType.OWNER]: 4,
  };

  private static readonly ROLE_PERMISSIONS: Record<
    MemberRoleType,
    Permission[]
  > = {
    [MemberRoleType.OWNER]: [
      Permission.DELETE_GROUP,
      Permission.EDIT_GROUP_SETTINGS,
      Permission.MANAGE_MEMBERS,
      Permission.REMOVE_MEMBERS,
      Permission.APPROVE_POSTS,
      Permission.DELETE_POSTS,
      Permission.PIN_POSTS,
      Permission.CREATE_POSTS,
      Permission.COMMENT_POSTS,
      Permission.VIEW_CONTENT,
    ],
    [MemberRoleType.ADMIN]: [
      Permission.EDIT_GROUP_SETTINGS,
      Permission.MANAGE_MEMBERS,
      Permission.REMOVE_MEMBERS,
      Permission.APPROVE_POSTS,
      Permission.DELETE_POSTS,
      Permission.PIN_POSTS,
      Permission.CREATE_POSTS,
      Permission.COMMENT_POSTS,
      Permission.VIEW_CONTENT,
    ],
    [MemberRoleType.MODERATOR]: [
      Permission.APPROVE_POSTS,
      Permission.DELETE_POSTS,
      Permission.PIN_POSTS,
      Permission.CREATE_POSTS,
      Permission.COMMENT_POSTS,
      Permission.VIEW_CONTENT,
    ],
    [MemberRoleType.MEMBER]: [
      Permission.CREATE_POSTS,
      Permission.COMMENT_POSTS,
      Permission.VIEW_CONTENT,
    ],
  };

  private readonly role: MemberRoleType;

  private constructor(role: MemberRoleType) {
    this.role = role;
  }

  static fromString(value: string): MemberRole {
    const upperValue = value.toUpperCase();

    if (!this.isValid(upperValue)) {
      throw new Error(`Invalid member role: ${value}`);
    }

    return new MemberRole(upperValue as MemberRoleType);
  }

  static isValid(value: string): boolean {
    return Object.values(MemberRoleType).includes(value as MemberRoleType);
  }

  static createOwner(): MemberRole {
    return new MemberRole(MemberRoleType.OWNER);
  }

  static createAdmin(): MemberRole {
    return new MemberRole(MemberRoleType.ADMIN);
  }

  static createModerator(): MemberRole {
    return new MemberRole(MemberRoleType.MODERATOR);
  }

  static createMember(): MemberRole {
    return new MemberRole(MemberRoleType.MEMBER);
  }

  isOwner(): boolean {
    return this.role === MemberRoleType.OWNER;
  }

  isAdmin(): boolean {
    return this.role === MemberRoleType.ADMIN;
  }

  isModerator(): boolean {
    return this.role === MemberRoleType.MODERATOR;
  }

  isMember(): boolean {
    return this.role === MemberRoleType.MEMBER;
  }

  hasPermission(permission: Permission): boolean {
    const permissions = MemberRole.ROLE_PERMISSIONS[this.role];
    return permissions.includes(permission);
  }

  getPriority(): number {
    return MemberRole.ROLE_HIERARCHY[this.role];
  }

  canManageRole(targetRole: MemberRole): boolean {
    if (this.role === MemberRoleType.OWNER) {
      return true;
    }
    return this.getPriority() > targetRole.getPriority();
  }

  isHigherThan(otherRole: MemberRole): boolean {
    return this.getPriority() > otherRole.getPriority();
  }

  isLowerThan(otherRole: MemberRole): boolean {
    return this.getPriority() < otherRole.getPriority();
  }

  getValue(): MemberRoleType {
    return this.role;
  }

  toString(): string {
    return this.role;
  }

  equals(other: MemberRole): boolean {
    return this.role === other.role;
  }
}
