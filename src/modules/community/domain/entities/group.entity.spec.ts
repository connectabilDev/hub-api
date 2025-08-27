import { Group, GroupPrivacy, GroupCategory, MemberRole } from './group.entity';

describe('Group Entity', () => {
  const mockGroupProps = {
    name: 'Test Group',
    description: 'A test group for testing purposes',
    privacy: GroupPrivacy.PUBLIC,
    category: GroupCategory.TECHNOLOGY,
    rules: [],
    ownerId: 'owner-123',
  };

  describe('create', () => {
    it('should create a new group with default values', () => {
      const group = Group.create(mockGroupProps);

      expect(group.id).toBeDefined();
      expect(group.name).toBe(mockGroupProps.name);
      expect(group.description).toBe(mockGroupProps.description);
      expect(group.privacy).toBe(mockGroupProps.privacy);
      expect(group.category).toBe(mockGroupProps.category);
      expect(group.rules).toEqual([]);
      expect(group.ownerId).toBe(mockGroupProps.ownerId);
      expect(group.memberCount).toBe(1);
      expect(group.createdAt).toBeInstanceOf(Date);
      expect(group.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('canJoin', () => {
    it('should allow joining public groups', () => {
      const publicGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.PUBLIC,
      });

      expect(publicGroup.canJoin('user-456')).toBe(true);
    });

    it('should allow joining closed groups with approval', () => {
      const closedGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.CLOSED,
      });

      expect(closedGroup.canJoin('user-456')).toBe(true);
    });

    it('should not allow joining secret groups', () => {
      const secretGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.SECRET,
      });

      expect(secretGroup.canJoin('user-456')).toBe(false);
    });
  });

  describe('canPost', () => {
    const group = Group.create(mockGroupProps);

    it('should allow owner to post', () => {
      expect(group.canPost(mockGroupProps.ownerId, MemberRole.OWNER)).toBe(
        true,
      );
    });

    it('should allow admins to post', () => {
      expect(group.canPost('user-456', MemberRole.ADMIN)).toBe(true);
    });

    it('should allow moderators to post', () => {
      expect(group.canPost('user-456', MemberRole.MODERATOR)).toBe(true);
    });

    it('should allow members to post', () => {
      expect(group.canPost('user-456', MemberRole.MEMBER)).toBe(true);
    });
  });

  describe('canManage', () => {
    const group = Group.create(mockGroupProps);

    it('should allow owner to manage', () => {
      expect(group.canManage(mockGroupProps.ownerId, MemberRole.OWNER)).toBe(
        true,
      );
    });

    it('should allow admins to manage', () => {
      expect(group.canManage('user-456', MemberRole.ADMIN)).toBe(true);
    });

    it('should allow moderators to manage', () => {
      expect(group.canManage('user-456', MemberRole.MODERATOR)).toBe(true);
    });

    it('should not allow regular members to manage', () => {
      expect(group.canManage('user-456', MemberRole.MEMBER)).toBe(false);
    });
  });

  describe('privacy checks', () => {
    it('should correctly identify public groups', () => {
      const publicGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.PUBLIC,
      });

      expect(publicGroup.isPublic()).toBe(true);
      expect(publicGroup.isClosed()).toBe(false);
      expect(publicGroup.isSecret()).toBe(false);
    });

    it('should correctly identify closed groups', () => {
      const closedGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.CLOSED,
      });

      expect(closedGroup.isPublic()).toBe(false);
      expect(closedGroup.isClosed()).toBe(true);
      expect(closedGroup.isSecret()).toBe(false);
    });

    it('should correctly identify secret groups', () => {
      const secretGroup = Group.create({
        ...mockGroupProps,
        privacy: GroupPrivacy.SECRET,
      });

      expect(secretGroup.isPublic()).toBe(false);
      expect(secretGroup.isClosed()).toBe(false);
      expect(secretGroup.isSecret()).toBe(true);
    });
  });

  describe('member count management', () => {
    it('should increment member count', () => {
      const group = Group.create(mockGroupProps);

      const updatedGroup = group.incrementMemberCount();

      expect(updatedGroup.memberCount).toBe(2);
    });

    it('should decrement member count', () => {
      const group = Group.create(mockGroupProps);
      const groupWithMembers = group.incrementMemberCount();

      const updatedGroup = groupWithMembers.decrementMemberCount();

      expect(updatedGroup.memberCount).toBe(1);
    });

    it('should not allow member count below 1', () => {
      const group = Group.create(mockGroupProps);

      const updatedGroup = group.decrementMemberCount();

      expect(updatedGroup.memberCount).toBe(1);
    });
  });

  describe('updateInfo', () => {
    it('should update group name and description', async () => {
      const group = Group.create(mockGroupProps);
      const newName = 'Updated Group Name';
      const newDescription = 'Updated description';

      await new Promise((resolve) => setTimeout(resolve, 1));
      const updatedGroup = group.updateInfo(newName, newDescription);

      expect(updatedGroup.name).toBe(newName);
      expect(updatedGroup.description).toBe(newDescription);
      expect(updatedGroup.updatedAt.getTime()).toBeGreaterThan(
        group.updatedAt.getTime(),
      );
    });

    it('should update only name when description is not provided', () => {
      const group = Group.create(mockGroupProps);
      const newName = 'Updated Group Name';

      const updatedGroup = group.updateInfo(newName);

      expect(updatedGroup.name).toBe(newName);
      expect(updatedGroup.description).toBe(group.description);
    });
  });

  describe('rule management', () => {
    it('should add a new rule', () => {
      const group = Group.create(mockGroupProps);
      const ruleTitle = 'Be respectful';
      const ruleDescription = 'Treat all members with respect';

      const updatedGroup = group.addRule(ruleTitle, ruleDescription);

      expect(updatedGroup.rules).toHaveLength(1);
      expect(updatedGroup.rules[0].title).toBe(ruleTitle);
      expect(updatedGroup.rules[0].description).toBe(ruleDescription);
      expect(updatedGroup.rules[0].order).toBe(1);
    });

    it('should remove a rule', () => {
      const group = Group.create(mockGroupProps);
      const groupWithRule = group.addRule('Rule 1', 'Description 1');
      const ruleId = groupWithRule.rules[0].id;

      const updatedGroup = groupWithRule.removeRule(ruleId);

      expect(updatedGroup.rules).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    it('should return group data as JSON object', () => {
      const group = Group.create(mockGroupProps);

      const json = group.toJSON();

      expect(json).toEqual({
        id: group.id,
        name: group.name,
        description: group.description,
        privacy: group.privacy,
        category: group.category,
        rules: group.rules,
        ownerId: group.ownerId,
        memberCount: group.memberCount,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      });
    });
  });
});
