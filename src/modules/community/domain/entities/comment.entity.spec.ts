import { Comment } from './comment.entity';

describe('Comment Entity', () => {
  const mockCommentProps = {
    postId: 'post-123',
    userId: 'user-123',
    content: 'This is a test comment',
  };

  describe('create', () => {
    it('should create a new comment', () => {
      const comment = Comment.create(mockCommentProps);

      expect(comment.id).toBeDefined();
      expect(comment.postId).toBe(mockCommentProps.postId);
      expect(comment.userId).toBe(mockCommentProps.userId);
      expect(comment.content).toBe(mockCommentProps.content);
      expect(comment.parentCommentId).toBeUndefined();
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a reply comment with parent ID', () => {
      const replyProps = {
        ...mockCommentProps,
        parentCommentId: 'comment-456',
      };

      const reply = Comment.create(replyProps);

      expect(reply.parentCommentId).toBe('comment-456');
      expect(reply.isReply()).toBe(true);
    });
  });

  describe('permissions', () => {
    it('should allow edit by comment owner', () => {
      const comment = Comment.create(mockCommentProps);

      expect(comment.canEdit(mockCommentProps.userId)).toBe(true);
      expect(comment.canEdit('other-user')).toBe(false);
    });

    it('should allow delete by comment owner', () => {
      const comment = Comment.create(mockCommentProps);

      expect(comment.canDelete(mockCommentProps.userId)).toBe(true);
      expect(comment.canDelete('other-user')).toBe(false);
    });
  });

  describe('isReply', () => {
    it('should return false for top-level comments', () => {
      const comment = Comment.create(mockCommentProps);

      expect(comment.isReply()).toBe(false);
    });

    it('should return true for reply comments', () => {
      const replyProps = {
        ...mockCommentProps,
        parentCommentId: 'comment-456',
      };
      const reply = Comment.create(replyProps);

      expect(reply.isReply()).toBe(true);
    });
  });

  describe('edit', () => {
    it('should return new comment instance with updated content', async () => {
      const comment = Comment.create(mockCommentProps);
      const newContent = 'Updated comment content';

      await new Promise((resolve) => setTimeout(resolve, 1));
      const editedComment = comment.edit(newContent);

      expect(editedComment).not.toBe(comment);
      expect(editedComment.content).toBe(newContent);
      expect(editedComment.updatedAt.getTime()).toBeGreaterThan(
        comment.updatedAt.getTime(),
      );
      expect(editedComment.id).toBe(comment.id);
    });
  });

  describe('toJSON', () => {
    it('should return comment data as JSON object', () => {
      const comment = Comment.create(mockCommentProps);

      const json = comment.toJSON();

      expect(json).toEqual({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        parentCommentId: comment.parentCommentId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        isReply: comment.isReply(),
      });
    });
  });
});
