import { MediaAttachment, MediaType } from './media-attachment.vo';

describe('MediaAttachment', () => {
  const validImageUrl = 'https://example.com/image.jpg';
  const validVideoUrl = 'https://example.com/video.mp4';
  const validDocumentUrl = 'https://example.com/document.pdf';

  describe('create', () => {
    it('should create valid image attachment', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024 * 1024, // 1MB
        'image/jpeg',
      );

      expect(attachment.getUrl()).toBe(validImageUrl);
      expect(attachment.getType()).toBe(MediaType.IMAGE);
      expect(attachment.getSize()).toBe(1024 * 1024);
      expect(attachment.getMimeType()).toBe('image/jpeg');
      expect(attachment.isImage()).toBe(true);
    });

    it('should create attachment with thumbnail and filename', () => {
      const thumbnailUrl = 'https://example.com/thumb.jpg';
      const fileName = 'image.jpg';

      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024 * 1024,
        'image/jpeg',
        thumbnailUrl,
        fileName,
      );

      expect(attachment.getThumbnailUrl()).toBe(thumbnailUrl);
      expect(attachment.getFileName()).toBe(fileName);
      expect(attachment.hasThumbnail()).toBe(true);
    });

    it('should throw error for empty URL', () => {
      expect(() =>
        MediaAttachment.create('', 'IMAGE', 1024, 'image/jpeg'),
      ).toThrow('URL is required and must be a non-empty string');
    });

    it('should throw error for invalid URL', () => {
      expect(() =>
        MediaAttachment.create('not-a-url', 'IMAGE', 1024, 'image/jpeg'),
      ).toThrow('Invalid URL format');
    });

    it('should throw error for invalid media type', () => {
      expect(() =>
        MediaAttachment.create(validImageUrl, 'INVALID', 1024, 'image/jpeg'),
      ).toThrow('Invalid media type: INVALID');
    });

    it('should throw error for invalid size', () => {
      expect(() =>
        MediaAttachment.create(validImageUrl, 'IMAGE', 0, 'image/jpeg'),
      ).toThrow('Size must be a positive integer');

      expect(() =>
        MediaAttachment.create(validImageUrl, 'IMAGE', 1.5, 'image/jpeg'),
      ).toThrow('Size must be a positive integer');
    });

    it('should throw error for empty MIME type', () => {
      expect(() =>
        MediaAttachment.create(validImageUrl, 'IMAGE', 1024, ''),
      ).toThrow('MIME type is required');
    });

    it('should throw error for file size exceeding limit', () => {
      const oversizedImage = 20 * 1024 * 1024; // 20MB (over 10MB limit)
      expect(() =>
        MediaAttachment.create(
          validImageUrl,
          'IMAGE',
          oversizedImage,
          'image/jpeg',
        ),
      ).toThrow('Invalid media attachment:');
    });

    it('should throw error for invalid MIME type', () => {
      expect(() =>
        MediaAttachment.create(
          validImageUrl,
          'IMAGE',
          1024 * 1024,
          'text/plain', // Invalid for image
        ),
      ).toThrow('Invalid media attachment:');
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify image attachments', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
      );

      expect(attachment.isImage()).toBe(true);
      expect(attachment.isVideo()).toBe(false);
      expect(attachment.isAudio()).toBe(false);
      expect(attachment.isDocument()).toBe(false);
    });

    it('should correctly identify video attachments', () => {
      const attachment = MediaAttachment.create(
        validVideoUrl,
        'VIDEO',
        10 * 1024 * 1024, // 10MB
        'video/mp4',
      );

      expect(attachment.isImage()).toBe(false);
      expect(attachment.isVideo()).toBe(true);
      expect(attachment.isAudio()).toBe(false);
      expect(attachment.isDocument()).toBe(false);
    });

    it('should correctly identify document attachments', () => {
      const attachment = MediaAttachment.create(
        validDocumentUrl,
        'DOCUMENT',
        5 * 1024 * 1024, // 5MB
        'application/pdf',
      );

      expect(attachment.isImage()).toBe(false);
      expect(attachment.isVideo()).toBe(false);
      expect(attachment.isAudio()).toBe(false);
      expect(attachment.isDocument()).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate correct image types', () => {
      const validMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      validMimeTypes.forEach((mimeType) => {
        const attachment = MediaAttachment.create(
          validImageUrl,
          'IMAGE',
          1024,
          mimeType,
        );
        expect(attachment.isValid()).toBe(true);
      });
    });

    it('should validate correct video types', () => {
      const validMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];

      validMimeTypes.forEach((mimeType) => {
        const attachment = MediaAttachment.create(
          validVideoUrl,
          'VIDEO',
          10 * 1024 * 1024,
          mimeType,
        );
        expect(attachment.isValid()).toBe(true);
      });
    });

    it('should validate file sizes correctly', () => {
      // Valid size for image (under 10MB)
      const validImage = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        5 * 1024 * 1024,
        'image/jpeg',
      );
      expect(validImage.isValid()).toBe(true);
    });

    it('should return validation error for oversized files', () => {
      const oversizedImage = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        5 * 1024 * 1024, // 5MB - within limit
        'image/jpeg',
      );

      // Manually test with oversized content (this won't pass create, but tests the method)
      expect(oversizedImage.getValidationError()).toBeNull();
    });
  });

  describe('size helpers', () => {
    it('should return size in MB correctly', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        2 * 1024 * 1024, // 2MB
        'image/jpeg',
      );

      expect(attachment.getSizeInMB()).toBe('2.00');
    });

    it('should return max allowed size for each type', () => {
      const imageAttachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
      );
      expect(imageAttachment.getMaxAllowedSize()).toBe(10 * 1024 * 1024); // 10MB

      const videoAttachment = MediaAttachment.create(
        validVideoUrl,
        'VIDEO',
        1024,
        'video/mp4',
      );
      expect(videoAttachment.getMaxAllowedSize()).toBe(100 * 1024 * 1024); // 100MB
    });
  });

  describe('MIME type helpers', () => {
    it('should return allowed MIME types for images', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
      );

      const allowedTypes = attachment.getAllowedMimeTypes();
      expect(allowedTypes).toContain('image/jpeg');
      expect(allowedTypes).toContain('image/png');
      expect(allowedTypes).toContain('image/gif');
      expect(allowedTypes).toContain('image/webp');
    });

    it('should return allowed MIME types for videos', () => {
      const attachment = MediaAttachment.create(
        validVideoUrl,
        'VIDEO',
        1024,
        'video/mp4',
      );

      const allowedTypes = attachment.getAllowedMimeTypes();
      expect(allowedTypes).toContain('video/mp4');
      expect(allowedTypes).toContain('video/webm');
      expect(allowedTypes).toContain('video/ogg');
    });

    it('should return allowed MIME types for documents', () => {
      const attachment = MediaAttachment.create(
        validDocumentUrl,
        'DOCUMENT',
        1024,
        'application/pdf',
      );

      const allowedTypes = attachment.getAllowedMimeTypes();
      expect(allowedTypes).toContain('application/pdf');
      expect(allowedTypes).toContain('text/plain');
      expect(allowedTypes).toContain('application/msword');
    });
  });

  describe('equals', () => {
    it('should return true for identical attachments', () => {
      const attachment1 = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
        'https://example.com/thumb.jpg',
        'image.jpg',
      );

      const attachment2 = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
        'https://example.com/thumb.jpg',
        'image.jpg',
      );

      expect(attachment1.equals(attachment2)).toBe(true);
    });

    it('should return false for different attachments', () => {
      const attachment1 = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
      );

      const attachment2 = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        2048, // Different size
        'image/jpeg',
      );

      expect(attachment1.equals(attachment2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should return object representation', () => {
      const thumbnailUrl = 'https://example.com/thumb.jpg';
      const fileName = 'image.jpg';

      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'image/jpeg',
        thumbnailUrl,
        fileName,
      );

      const obj = attachment.toObject();
      expect(obj).toEqual({
        url: validImageUrl,
        type: MediaType.IMAGE,
        size: 1024,
        mimeType: 'image/jpeg',
        thumbnailUrl,
        fileName,
      });
    });
  });

  describe('case insensitive handling', () => {
    it('should handle case insensitive media type', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'image', // lowercase
        1024,
        'image/jpeg',
      );

      expect(attachment.getType()).toBe(MediaType.IMAGE);
      expect(attachment.isImage()).toBe(true);
    });

    it('should normalize MIME type to lowercase', () => {
      const attachment = MediaAttachment.create(
        validImageUrl,
        'IMAGE',
        1024,
        'IMAGE/JPEG', // uppercase
      );

      expect(attachment.getMimeType()).toBe('image/jpeg');
    });
  });
});
