import { PostContent } from './post-content.vo';

describe('PostContent', () => {
  describe('create', () => {
    it('should create valid post content', () => {
      const content = 'This is a valid post content';
      const postContent = PostContent.create(content);

      expect(postContent.getValue()).toBe(content);
      expect(postContent.getLength()).toBe(content.length);
      expect(postContent.isEmpty()).toBe(false);
    });

    it('should trim whitespace from content', () => {
      const content = '  This is a valid post content  ';
      const postContent = PostContent.create(content);

      expect(postContent.getValue()).toBe('This is a valid post content');
    });

    it('should throw error for empty content', () => {
      expect(() => PostContent.create('')).toThrow(
        'Content must be a non-empty string',
      );
    });

    it('should throw error for null content', () => {
      expect(() => PostContent.create(null as any)).toThrow(
        'Content must be a non-empty string',
      );
    });

    it('should throw error for undefined content', () => {
      expect(() => PostContent.create(undefined as any)).toThrow(
        'Content must be a non-empty string',
      );
    });

    it('should throw error for non-string content', () => {
      expect(() => PostContent.create(123 as any)).toThrow(
        'Content must be a non-empty string',
      );
    });

    it('should throw error for content below minimum length', () => {
      expect(() => PostContent.create(' ')).toThrow(
        'Content must be at least 1 characters',
      );
    });

    it('should throw error for content exceeding maximum length', () => {
      const longContent = 'a'.repeat(5001);
      expect(() => PostContent.create(longContent)).toThrow(
        'Content must not exceed 5000 characters',
      );
    });

    it('should accept content at maximum length', () => {
      const maxContent = 'a'.repeat(5000);
      const postContent = PostContent.create(maxContent);

      expect(postContent.getLength()).toBe(5000);
    });
  });

  describe('getSanitized', () => {
    it('should sanitize malicious scripts', () => {
      const maliciousContent = 'Hello <script>alert("xss")</script> World';
      const postContent = PostContent.create(maliciousContent);

      const sanitized = postContent.getSanitized();
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should allow safe HTML tags', () => {
      const safeContent =
        'Hello <strong>bold</strong> and <em>italic</em> text';
      const postContent = PostContent.create(safeContent);

      const sanitized = postContent.getSanitized();
      expect(sanitized).toContain('<strong>bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
    });

    it('should remove dangerous attributes', () => {
      const dangerousContent = '<a href="#" onclick="alert(\'xss\')">Link</a>';
      const postContent = PostContent.create(dangerousContent);

      const sanitized = postContent.getSanitized();
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('href');
    });
  });

  describe('isEmpty', () => {
    it('should return false for non-empty content', () => {
      const postContent = PostContent.create('Hello World');
      expect(postContent.isEmpty()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same content', () => {
      const content = 'Same content';
      const postContent1 = PostContent.create(content);
      const postContent2 = PostContent.create(content);

      expect(postContent1.equals(postContent2)).toBe(true);
    });

    it('should return false for different content', () => {
      const postContent1 = PostContent.create('Content 1');
      const postContent2 = PostContent.create('Content 2');

      expect(postContent1.equals(postContent2)).toBe(false);
    });
  });
});
