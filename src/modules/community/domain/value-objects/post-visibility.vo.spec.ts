import { PostVisibility, PostVisibilityType } from './post-visibility.vo';

describe('PostVisibility', () => {
  describe('fromString', () => {
    it('should create from valid string values', () => {
      const publicVis = PostVisibility.fromString('PUBLIC');
      expect(publicVis.getValue()).toBe(PostVisibilityType.PUBLIC);

      const privateVis = PostVisibility.fromString('private');
      expect(privateVis.getValue()).toBe(PostVisibilityType.PRIVATE);

      const connectionsVis = PostVisibility.fromString('Connections');
      expect(connectionsVis.getValue()).toBe(PostVisibilityType.CONNECTIONS);

      const groupVis = PostVisibility.fromString('GROUP');
      expect(groupVis.getValue()).toBe(PostVisibilityType.GROUP);
    });

    it('should throw error for invalid values', () => {
      expect(() => PostVisibility.fromString('INVALID')).toThrow(
        'Invalid post visibility: INVALID',
      );
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(PostVisibility.isValid('PUBLIC')).toBe(true);
      expect(PostVisibility.isValid('PRIVATE')).toBe(true);
      expect(PostVisibility.isValid('CONNECTIONS')).toBe(true);
      expect(PostVisibility.isValid('GROUP')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(PostVisibility.isValid('INVALID')).toBe(false);
      expect(PostVisibility.isValid('')).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create public visibility', () => {
      const visibility = PostVisibility.createPublic();
      expect(visibility.isPublic()).toBe(true);
    });

    it('should create private visibility', () => {
      const visibility = PostVisibility.createPrivate();
      expect(visibility.isPrivate()).toBe(true);
    });

    it('should create connections visibility', () => {
      const visibility = PostVisibility.createConnections();
      expect(visibility.isConnections()).toBe(true);
    });

    it('should create group visibility', () => {
      const visibility = PostVisibility.createGroup();
      expect(visibility.isGroup()).toBe(true);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify public posts', () => {
      const visibility = PostVisibility.createPublic();
      expect(visibility.isPublic()).toBe(true);
      expect(visibility.isPrivate()).toBe(false);
      expect(visibility.isConnections()).toBe(false);
      expect(visibility.isGroup()).toBe(false);
    });

    it('should correctly identify private posts', () => {
      const visibility = PostVisibility.createPrivate();
      expect(visibility.isPublic()).toBe(false);
      expect(visibility.isPrivate()).toBe(true);
      expect(visibility.isConnections()).toBe(false);
      expect(visibility.isGroup()).toBe(false);
    });
  });

  describe('canView', () => {
    const authorId = 'author-123';
    const userId = 'user-456';
    const connectionIds = ['user-456', 'user-789'];
    const groupMemberIds = ['user-456', 'user-999'];

    it('should allow author to view their own post regardless of visibility', () => {
      const privateVis = PostVisibility.createPrivate();
      expect(privateVis.canView(authorId, [], [], authorId)).toBe(true);
    });

    it('should allow anyone to view public posts', () => {
      const publicVis = PostVisibility.createPublic();
      expect(publicVis.canView('anyone', [], [], authorId)).toBe(true);
    });

    it('should deny access to private posts for non-authors', () => {
      const privateVis = PostVisibility.createPrivate();
      expect(
        privateVis.canView(userId, connectionIds, groupMemberIds, authorId),
      ).toBe(false);
    });

    it('should allow connections to view connections-only posts', () => {
      const connectionsVis = PostVisibility.createConnections();
      expect(connectionsVis.canView(userId, connectionIds, [], authorId)).toBe(
        true,
      );
      expect(connectionsVis.canView('stranger', [], [], authorId)).toBe(false);
    });

    it('should allow group members to view group posts', () => {
      const groupVis = PostVisibility.createGroup();
      expect(groupVis.canView(userId, [], groupMemberIds, authorId)).toBe(true);
      expect(groupVis.canView('non-member', [], [], authorId)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same visibility types', () => {
      const vis1 = PostVisibility.createPublic();
      const vis2 = PostVisibility.createPublic();
      expect(vis1.equals(vis2)).toBe(true);
    });

    it('should return false for different visibility types', () => {
      const vis1 = PostVisibility.createPublic();
      const vis2 = PostVisibility.createPrivate();
      expect(vis1.equals(vis2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const visibility = PostVisibility.createPublic();
      expect(visibility.toString()).toBe('PUBLIC');
    });
  });
});
