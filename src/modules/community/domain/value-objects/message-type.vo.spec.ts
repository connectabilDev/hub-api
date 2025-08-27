import { MessageType, MessageTypeEnum } from './message-type.vo';

describe('MessageType', () => {
  describe('fromString', () => {
    it('should create from valid string values', () => {
      const text = MessageType.fromString('TEXT');
      expect(text.getValue()).toBe(MessageTypeEnum.TEXT);

      const image = MessageType.fromString('image');
      expect(image.getValue()).toBe(MessageTypeEnum.IMAGE);

      const video = MessageType.fromString('Video');
      expect(video.getValue()).toBe(MessageTypeEnum.VIDEO);

      const document = MessageType.fromString('DOCUMENT');
      expect(document.getValue()).toBe(MessageTypeEnum.DOCUMENT);

      const audio = MessageType.fromString('AUDIO');
      expect(audio.getValue()).toBe(MessageTypeEnum.AUDIO);

      const system = MessageType.fromString('SYSTEM');
      expect(system.getValue()).toBe(MessageTypeEnum.SYSTEM);
    });

    it('should throw error for invalid values', () => {
      expect(() => MessageType.fromString('INVALID')).toThrow(
        'Invalid message type: INVALID',
      );
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(MessageType.isValid('TEXT')).toBe(true);
      expect(MessageType.isValid('IMAGE')).toBe(true);
      expect(MessageType.isValid('VIDEO')).toBe(true);
      expect(MessageType.isValid('DOCUMENT')).toBe(true);
      expect(MessageType.isValid('AUDIO')).toBe(true);
      expect(MessageType.isValid('SYSTEM')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(MessageType.isValid('INVALID')).toBe(false);
      expect(MessageType.isValid('')).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create text type', () => {
      const type = MessageType.createText();
      expect(type.isText()).toBe(true);
    });

    it('should create image type', () => {
      const type = MessageType.createImage();
      expect(type.isImage()).toBe(true);
    });

    it('should create video type', () => {
      const type = MessageType.createVideo();
      expect(type.isVideo()).toBe(true);
    });

    it('should create document type', () => {
      const type = MessageType.createDocument();
      expect(type.isDocument()).toBe(true);
    });

    it('should create audio type', () => {
      const type = MessageType.createAudio();
      expect(type.isAudio()).toBe(true);
    });

    it('should create system type', () => {
      const type = MessageType.createSystem();
      expect(type.isSystem()).toBe(true);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify text messages', () => {
      const type = MessageType.createText();
      expect(type.isText()).toBe(true);
      expect(type.isImage()).toBe(false);
      expect(type.isVideo()).toBe(false);
      expect(type.isDocument()).toBe(false);
      expect(type.isAudio()).toBe(false);
      expect(type.isSystem()).toBe(false);
    });

    it('should correctly identify image messages', () => {
      const type = MessageType.createImage();
      expect(type.isText()).toBe(false);
      expect(type.isImage()).toBe(true);
      expect(type.isVideo()).toBe(false);
    });
  });

  describe('media detection', () => {
    it('should identify media types correctly', () => {
      expect(MessageType.createImage().isMedia()).toBe(true);
      expect(MessageType.createVideo().isMedia()).toBe(true);
      expect(MessageType.createAudio().isMedia()).toBe(true);
      expect(MessageType.createText().isMedia()).toBe(false);
      expect(MessageType.createDocument().isMedia()).toBe(false);
      expect(MessageType.createSystem().isMedia()).toBe(false);
    });
  });

  describe('URL requirements', () => {
    it('should identify types that require URL', () => {
      expect(MessageType.createImage().requiresUrl()).toBe(true);
      expect(MessageType.createVideo().requiresUrl()).toBe(true);
      expect(MessageType.createAudio().requiresUrl()).toBe(true);
      expect(MessageType.createDocument().requiresUrl()).toBe(true);
      expect(MessageType.createText().requiresUrl()).toBe(false);
      expect(MessageType.createSystem().requiresUrl()).toBe(false);
    });
  });

  describe('file size limits', () => {
    it('should return correct max sizes', () => {
      expect(MessageType.createText().getMaxSize()).toBe(0);
      expect(MessageType.createImage().getMaxSize()).toBe(10 * 1024 * 1024); // 10MB
      expect(MessageType.createVideo().getMaxSize()).toBe(100 * 1024 * 1024); // 100MB
      expect(MessageType.createDocument().getMaxSize()).toBe(50 * 1024 * 1024); // 50MB
      expect(MessageType.createAudio().getMaxSize()).toBe(20 * 1024 * 1024); // 20MB
      expect(MessageType.createSystem().getMaxSize()).toBe(0);
    });

    it('should validate file sizes correctly', () => {
      const imageType = MessageType.createImage();
      expect(imageType.validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB - valid
      expect(imageType.validateFileSize(15 * 1024 * 1024)).toBe(false); // 15MB - invalid

      const textType = MessageType.createText();
      expect(textType.validateFileSize(1000)).toBe(true); // Text doesn't require files
    });
  });

  describe('MIME types', () => {
    it('should return correct MIME types for images', () => {
      const imageType = MessageType.createImage();
      const mimeTypes = imageType.getAcceptedMimeTypes();
      expect(mimeTypes).toContain('image/jpeg');
      expect(mimeTypes).toContain('image/png');
      expect(mimeTypes).toContain('image/gif');
      expect(mimeTypes).toContain('image/webp');
    });

    it('should return correct MIME types for videos', () => {
      const videoType = MessageType.createVideo();
      const mimeTypes = videoType.getAcceptedMimeTypes();
      expect(mimeTypes).toContain('video/mp4');
      expect(mimeTypes).toContain('video/webm');
      expect(mimeTypes).toContain('video/ogg');
    });

    it('should return correct MIME types for audio', () => {
      const audioType = MessageType.createAudio();
      const mimeTypes = audioType.getAcceptedMimeTypes();
      expect(mimeTypes).toContain('audio/mpeg');
      expect(mimeTypes).toContain('audio/wav');
      expect(mimeTypes).toContain('audio/ogg');
      expect(mimeTypes).toContain('audio/aac');
    });

    it('should return correct MIME types for documents', () => {
      const documentType = MessageType.createDocument();
      const mimeTypes = documentType.getAcceptedMimeTypes();
      expect(mimeTypes).toContain('application/pdf');
      expect(mimeTypes).toContain('application/msword');
      expect(mimeTypes).toContain('text/plain');
    });

    it('should return empty array for text and system types', () => {
      expect(MessageType.createText().getAcceptedMimeTypes()).toEqual([]);
      expect(MessageType.createSystem().getAcceptedMimeTypes()).toEqual([]);
    });
  });

  describe('equals', () => {
    it('should return true for same message types', () => {
      const type1 = MessageType.createImage();
      const type2 = MessageType.createImage();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different message types', () => {
      const type1 = MessageType.createImage();
      const type2 = MessageType.createVideo();
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const type = MessageType.createVideo();
      expect(type.toString()).toBe('VIDEO');
    });
  });
});
