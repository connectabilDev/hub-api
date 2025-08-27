import { MemberRole, MemberRoleType, Permission } from './member-role.vo';

describe('MemberRole', () => {
  describe('fromString', () => {
    it('should create from valid string values', () => {
      const owner = MemberRole.fromString('OWNER');
      expect(owner.getValue()).toBe(MemberRoleType.OWNER);

      const admin = MemberRole.fromString('admin');
      expect(admin.getValue()).toBe(MemberRoleType.ADMIN);

      const moderator = MemberRole.fromString('Moderator');
      expect(moderator.getValue()).toBe(MemberRoleType.MODERATOR);

      const member = MemberRole.fromString('MEMBER');
      expect(member.getValue()).toBe(MemberRoleType.MEMBER);
    });

    it('should throw error for invalid values', () => {
      expect(() => MemberRole.fromString('INVALID')).toThrow(
        'Invalid member role: INVALID',
      );
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(MemberRole.isValid('OWNER')).toBe(true);
      expect(MemberRole.isValid('ADMIN')).toBe(true);
      expect(MemberRole.isValid('MODERATOR')).toBe(true);
      expect(MemberRole.isValid('MEMBER')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(MemberRole.isValid('INVALID')).toBe(false);
      expect(MemberRole.isValid('')).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create owner role', () => {
      const role = MemberRole.createOwner();
      expect(role.isOwner()).toBe(true);
    });

    it('should create admin role', () => {
      const role = MemberRole.createAdmin();
      expect(role.isAdmin()).toBe(true);
    });

    it('should create moderator role', () => {
      const role = MemberRole.createModerator();
      expect(role.isModerator()).toBe(true);
    });

    it('should create member role', () => {
      const role = MemberRole.createMember();
      expect(role.isMember()).toBe(true);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify owner', () => {
      const role = MemberRole.createOwner();
      expect(role.isOwner()).toBe(true);
      expect(role.isAdmin()).toBe(false);
      expect(role.isModerator()).toBe(false);
      expect(role.isMember()).toBe(false);
    });

    it('should correctly identify admin', () => {
      const role = MemberRole.createAdmin();
      expect(role.isOwner()).toBe(false);
      expect(role.isAdmin()).toBe(true);
      expect(role.isModerator()).toBe(false);
      expect(role.isMember()).toBe(false);
    });
  });

  describe('permissions', () => {
    it('should grant all permissions to owner', () => {
      const owner = MemberRole.createOwner();
      expect(owner.hasPermission(Permission.DELETE_GROUP)).toBe(true);
      expect(owner.hasPermission(Permission.EDIT_GROUP_SETTINGS)).toBe(true);
      expect(owner.hasPermission(Permission.MANAGE_MEMBERS)).toBe(true);
      expect(owner.hasPermission(Permission.CREATE_POSTS)).toBe(true);
    });

    it('should not grant delete group permission to admin', () => {
      const admin = MemberRole.createAdmin();
      expect(admin.hasPermission(Permission.DELETE_GROUP)).toBe(false);
      expect(admin.hasPermission(Permission.EDIT_GROUP_SETTINGS)).toBe(true);
      expect(admin.hasPermission(Permission.MANAGE_MEMBERS)).toBe(true);
    });

    it('should grant limited permissions to moderator', () => {
      const moderator = MemberRole.createModerator();
      expect(moderator.hasPermission(Permission.DELETE_GROUP)).toBe(false);
      expect(moderator.hasPermission(Permission.MANAGE_MEMBERS)).toBe(false);
      expect(moderator.hasPermission(Permission.APPROVE_POSTS)).toBe(true);
      expect(moderator.hasPermission(Permission.DELETE_POSTS)).toBe(true);
    });

    it('should grant basic permissions to member', () => {
      const member = MemberRole.createMember();
      expect(member.hasPermission(Permission.DELETE_GROUP)).toBe(false);
      expect(member.hasPermission(Permission.MANAGE_MEMBERS)).toBe(false);
      expect(member.hasPermission(Permission.CREATE_POSTS)).toBe(true);
      expect(member.hasPermission(Permission.VIEW_CONTENT)).toBe(true);
    });
  });

  describe('hierarchy', () => {
    it('should return correct priority values', () => {
      expect(MemberRole.createOwner().getPriority()).toBe(4);
      expect(MemberRole.createAdmin().getPriority()).toBe(3);
      expect(MemberRole.createModerator().getPriority()).toBe(2);
      expect(MemberRole.createMember().getPriority()).toBe(1);
    });

    it('should correctly compare role hierarchy', () => {
      const owner = MemberRole.createOwner();
      const admin = MemberRole.createAdmin();
      const moderator = MemberRole.createModerator();
      const member = MemberRole.createMember();

      expect(owner.isHigherThan(admin)).toBe(true);
      expect(admin.isHigherThan(moderator)).toBe(true);
      expect(moderator.isHigherThan(member)).toBe(true);

      expect(member.isLowerThan(moderator)).toBe(true);
      expect(moderator.isLowerThan(admin)).toBe(true);
      expect(admin.isLowerThan(owner)).toBe(true);
    });
  });

  describe('role management', () => {
    it('should allow owner to manage all roles', () => {
      const owner = MemberRole.createOwner();
      expect(owner.canManageRole(MemberRole.createAdmin())).toBe(true);
      expect(owner.canManageRole(MemberRole.createModerator())).toBe(true);
      expect(owner.canManageRole(MemberRole.createMember())).toBe(true);
    });

    it('should allow admin to manage lower roles', () => {
      const admin = MemberRole.createAdmin();
      expect(admin.canManageRole(MemberRole.createOwner())).toBe(false);
      expect(admin.canManageRole(MemberRole.createAdmin())).toBe(false);
      expect(admin.canManageRole(MemberRole.createModerator())).toBe(true);
      expect(admin.canManageRole(MemberRole.createMember())).toBe(true);
    });

    it('should not allow member to manage any roles', () => {
      const member = MemberRole.createMember();
      expect(member.canManageRole(MemberRole.createOwner())).toBe(false);
      expect(member.canManageRole(MemberRole.createAdmin())).toBe(false);
      expect(member.canManageRole(MemberRole.createModerator())).toBe(false);
      expect(member.canManageRole(MemberRole.createMember())).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same role types', () => {
      const role1 = MemberRole.createOwner();
      const role2 = MemberRole.createOwner();
      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different role types', () => {
      const role1 = MemberRole.createOwner();
      const role2 = MemberRole.createAdmin();
      expect(role1.equals(role2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const role = MemberRole.createModerator();
      expect(role.toString()).toBe('MODERATOR');
    });
  });
});
