import { Post, PostVisibility } from './post.entity';

describe('Post Entity', () => {
  const mockPostProps = {
    userId: 'user-123',
    content: 'Test post content',
    visibility: PostVisibility.PUBLIC,
    media: [],
    tags: ['test', 'community'],
  };

  describe('create', () => {
    it('should create a new post with default values', () => {
      const post = Post.create(mockPostProps);

      expect(post.id).toBeDefined();
      expect(post.userId).toBe(mockPostProps.userId);
      expect(post.content).toBe(mockPostProps.content);
      expect(post.visibility).toBe(mockPostProps.visibility);
      expect(post.media).toEqual([]);
      expect(post.tags).toEqual(['test', 'community']);
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
      expect(post.sharesCount).toBe(0);
      expect(post.likedByUserIds).toEqual([]);
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('like', () => {
    it('should add user to liked users and increment likes count', () => {
      const post = Post.create(mockPostProps);
      const userId = 'user-456';

      const likedPost = post.like(userId);

      expect(likedPost.likesCount).toBe(1);
      expect(likedPost.likedByUserIds).toContain(userId);
      expect(likedPost.isLikedBy(userId)).toBe(true);
    });

    it('should not duplicate likes from same user', () => {
      const post = Post.create(mockPostProps);
      const userId = 'user-456';

      const firstLike = post.like(userId);
      const secondLike = firstLike.like(userId);

      expect(secondLike.likesCount).toBe(1);
      expect(secondLike.likedByUserIds).toEqual([userId]);
    });
  });

  describe('unlike', () => {
    it('should remove user from liked users and decrement likes count', () => {
      const post = Post.create(mockPostProps);
      const userId = 'user-456';

      const likedPost = post.like(userId);
      const unlikedPost = likedPost.unlike(userId);

      expect(unlikedPost.likesCount).toBe(0);
      expect(unlikedPost.likedByUserIds).not.toContain(userId);
      expect(unlikedPost.isLikedBy(userId)).toBe(false);
    });

    it('should not affect post if user has not liked it', () => {
      const post = Post.create(mockPostProps);
      const userId = 'user-456';

      const unlikedPost = post.unlike(userId);

      expect(unlikedPost.likesCount).toBe(0);
      expect(unlikedPost.likedByUserIds).toEqual([]);
    });
  });

  describe('permissions', () => {
    it('should allow edit by post owner', () => {
      const post = Post.create(mockPostProps);

      expect(post.canEdit(mockPostProps.userId)).toBe(true);
      expect(post.canEdit('other-user')).toBe(false);
    });

    it('should allow delete by post owner', () => {
      const post = Post.create(mockPostProps);

      expect(post.canDelete(mockPostProps.userId)).toBe(true);
      expect(post.canDelete('other-user')).toBe(false);
    });
  });

  describe('counters', () => {
    it('should increment comments count', () => {
      const post = Post.create(mockPostProps);

      const updatedPost = post.incrementCommentsCount();

      expect(updatedPost.commentsCount).toBe(1);
    });

    it('should decrement comments count', () => {
      const post = Post.create(mockPostProps);
      const postWithComments = post.incrementCommentsCount();

      const updatedPost = postWithComments.decrementCommentsCount();

      expect(updatedPost.commentsCount).toBe(0);
    });

    it('should not allow negative comments count', () => {
      const post = Post.create(mockPostProps);

      const updatedPost = post.decrementCommentsCount();

      expect(updatedPost.commentsCount).toBe(0);
    });

    it('should increment shares count', () => {
      const post = Post.create(mockPostProps);

      const sharedPost = post.incrementSharesCount();

      expect(sharedPost.sharesCount).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('should return post data as JSON object', () => {
      const post = Post.create(mockPostProps);

      const json = post.toJSON();

      expect(json).toEqual({
        id: post.id,
        userId: post.userId,
        content: post.content,
        visibility: post.visibility,
        media: post.media,
        tags: post.tags,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      });
    });
  });
});
