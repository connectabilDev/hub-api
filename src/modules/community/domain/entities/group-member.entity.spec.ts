import { GroupMember, GroupMemberRole } from './group-member.entity';

describe('GroupMember Entity', () => {
  const mockMemberProps = {
    groupId: 'group-123',
    userId: 'user-456',
    role: GroupMemberRole.MEMBER,
  };

  describe('create', () => {
    it('should create a new group member', () => {
      const member = GroupMember.create(mockMemberProps);

      expect(member.groupId).toBe(mockMemberProps.groupId);
      expect(member.userId).toBe(mockMemberProps.userId);
      expect(member.role).toBe(mockMemberProps.role);
      expect(member.joinedAt).toBeInstanceOf(Date);
    });
  });

  describe('role checks', () => {
    it('should correctly identify owner', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });

      expect(owner.isOwner()).toBe(true);
      expect(owner.isAdmin()).toBe(false);
      expect(owner.isModerator()).toBe(false);
      expect(owner.isMember()).toBe(false);
    });

    it('should correctly identify admin', () => {
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });

      expect(admin.isOwner()).toBe(false);
      expect(admin.isAdmin()).toBe(true);
      expect(admin.isModerator()).toBe(false);
      expect(admin.isMember()).toBe(false);
    });

    it('should correctly identify moderator', () => {
      const moderator = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.MODERATOR,
      });

      expect(moderator.isOwner()).toBe(false);
      expect(moderator.isAdmin()).toBe(false);
      expect(moderator.isModerator()).toBe(true);
      expect(moderator.isMember()).toBe(false);
    });

    it('should correctly identify member', () => {
      const member = GroupMember.create(mockMemberProps);

      expect(member.isOwner()).toBe(false);
      expect(member.isAdmin()).toBe(false);
      expect(member.isModerator()).toBe(false);
      expect(member.isMember()).toBe(true);
    });
  });

  describe('permissions', () => {
    it('should allow owner to invite', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });

      expect(owner.canInvite()).toBe(true);
    });

    it('should allow admin to invite', () => {
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });

      expect(admin.canInvite()).toBe(true);
    });

    it('should allow moderator to invite', () => {
      const moderator = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.MODERATOR,
      });

      expect(moderator.canInvite()).toBe(true);
    });

    it('should not allow member to invite', () => {
      const member = GroupMember.create(mockMemberProps);

      expect(member.canInvite()).toBe(false);
    });

    it('should allow privileged roles to remove members', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });
      const moderator = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.MODERATOR,
      });
      const member = GroupMember.create(mockMemberProps);

      expect(owner.canRemoveMember()).toBe(true);
      expect(admin.canRemoveMember()).toBe(true);
      expect(moderator.canRemoveMember()).toBe(true);
      expect(member.canRemoveMember()).toBe(false);
    });

    it('should only allow owner and admin to manage group', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });
      const moderator = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.MODERATOR,
      });
      const member = GroupMember.create(mockMemberProps);

      expect(owner.canManageGroup()).toBe(true);
      expect(admin.canManageGroup()).toBe(true);
      expect(moderator.canManageGroup()).toBe(false);
      expect(member.canManageGroup()).toBe(false);
    });

    it('should only allow owner to promote members', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });

      expect(owner.canPromoteMembers()).toBe(true);
      expect(admin.canPromoteMembers()).toBe(false);
    });

    it('should allow privileged roles to moderate content', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });
      const moderator = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.MODERATOR,
      });
      const member = GroupMember.create(mockMemberProps);

      expect(owner.canModerateContent()).toBe(true);
      expect(admin.canModerateContent()).toBe(true);
      expect(moderator.canModerateContent()).toBe(true);
      expect(member.canModerateContent()).toBe(false);
    });
  });

  describe('role promotions', () => {
    it('should promote member to admin', () => {
      const member = GroupMember.create(mockMemberProps);

      const promotedMember = member.promoteToAdmin();

      expect(promotedMember.role).toBe(GroupMemberRole.ADMIN);
      expect(promotedMember).not.toBe(member);
    });

    it('should not demote owner when promoting to admin', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });

      const result = owner.promoteToAdmin();

      expect(result.role).toBe(GroupMemberRole.OWNER);
    });

    it('should promote member to moderator', () => {
      const member = GroupMember.create(mockMemberProps);

      const promotedMember = member.promoteToModerator();

      expect(promotedMember.role).toBe(GroupMemberRole.MODERATOR);
    });

    it('should demote admin to member', () => {
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });

      const demotedMember = admin.demoteToMember();

      expect(demotedMember.role).toBe(GroupMemberRole.MEMBER);
    });

    it('should not demote owner', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });

      const result = owner.demoteToMember();

      expect(result.role).toBe(GroupMemberRole.OWNER);
    });
  });

  describe('hasHigherRoleThan', () => {
    it('should return true when member has higher role', () => {
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });

      expect(owner.hasHigherRoleThan(admin)).toBe(true);
    });

    it('should return false when member has lower or equal role', () => {
      const admin = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.ADMIN,
      });
      const owner = GroupMember.create({
        ...mockMemberProps,
        role: GroupMemberRole.OWNER,
      });

      expect(admin.hasHigherRoleThan(owner)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return member data as JSON object', () => {
      const member = GroupMember.create(mockMemberProps);

      const json = member.toJSON();

      expect(json).toEqual({
        groupId: member.groupId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      });
    });
  });
});
