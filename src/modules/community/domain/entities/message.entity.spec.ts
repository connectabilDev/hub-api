import { Message, MessageType } from './message.entity';

describe('Message Entity', () => {
  const mockMessageProps = {
    conversationId: 'conversation-123',
    senderId: 'user-456',
    type: MessageType.TEXT,
    content: 'Hello, this is a test message!',
  };

  describe('create', () => {
    it('should create a new text message', () => {
      const message = Message.create(mockMessageProps);

      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe(mockMessageProps.conversationId);
      expect(message.senderId).toBe(mockMessageProps.senderId);
      expect(message.type).toBe(mockMessageProps.type);
      expect(message.content).toBe(mockMessageProps.content);
      expect(message.mediaUrl).toBeUndefined();
      expect(message.isRead).toBe(false);
      expect(message.isEdited).toBe(false);
      expect(message.createdAt).toBeInstanceOf(Date);
      expect(message.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a message with media URL', () => {
      const mediaMessageProps = {
        ...mockMessageProps,
        type: MessageType.IMAGE,
        mediaUrl: 'https://example.com/image.jpg',
      };

      const message = Message.create(mediaMessageProps);

      expect(message.type).toBe(MessageType.IMAGE);
      expect(message.mediaUrl).toBe('https://example.com/image.jpg');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const message = Message.create(mockMessageProps);

      await new Promise((resolve) => setTimeout(resolve, 1));
      const readMessage = message.markAsRead();

      expect(readMessage.isRead).toBe(true);
      expect(readMessage).not.toBe(message);
      expect(readMessage.updatedAt.getTime()).toBeGreaterThan(
        message.updatedAt.getTime(),
      );
    });

    it('should not change message if already read', () => {
      const message = Message.create(mockMessageProps);
      const readMessage = message.markAsRead();

      const sameMessage = readMessage.markAsRead();

      expect(sameMessage).toBe(readMessage);
    });
  });

  describe('edit', () => {
    it('should edit message content', async () => {
      const message = Message.create(mockMessageProps);
      const newContent = 'This is updated content';

      await new Promise((resolve) => setTimeout(resolve, 1));
      const editedMessage = message.edit(newContent);

      expect(editedMessage.content).toBe(newContent);
      expect(editedMessage.isEdited).toBe(true);
      expect(editedMessage).not.toBe(message);
      expect(editedMessage.updatedAt.getTime()).toBeGreaterThan(
        message.updatedAt.getTime(),
      );
    });

    it('should not change message if content is the same', () => {
      const message = Message.create(mockMessageProps);

      const sameMessage = message.edit(mockMessageProps.content);

      expect(sameMessage).toBe(message);
    });
  });

  describe('permissions', () => {
    it('should allow sender to edit text messages', () => {
      const message = Message.create(mockMessageProps);

      expect(message.canEdit(mockMessageProps.senderId)).toBe(true);
      expect(message.canEdit('other-user')).toBe(false);
    });

    it('should not allow editing non-text messages', () => {
      const imageMessage = Message.create({
        ...mockMessageProps,
        type: MessageType.IMAGE,
      });

      expect(imageMessage.canEdit(mockMessageProps.senderId)).toBe(false);
    });

    it('should allow sender to delete messages', () => {
      const message = Message.create(mockMessageProps);

      expect(message.canDelete(mockMessageProps.senderId)).toBe(true);
      expect(message.canDelete('other-user')).toBe(false);
    });
  });

  describe('message type checks', () => {
    it('should correctly identify text messages', () => {
      const textMessage = Message.create(mockMessageProps);

      expect(textMessage.isTextMessage()).toBe(true);
      expect(textMessage.isMediaMessage()).toBe(false);
      expect(textMessage.isSystemMessage()).toBe(false);
    });

    it('should correctly identify media messages', () => {
      const imageMessage = Message.create({
        ...mockMessageProps,
        type: MessageType.IMAGE,
      });

      expect(imageMessage.isTextMessage()).toBe(false);
      expect(imageMessage.isMediaMessage()).toBe(true);
      expect(imageMessage.isSystemMessage()).toBe(false);
    });

    it('should correctly identify system messages', () => {
      const systemMessage = Message.create({
        ...mockMessageProps,
        type: MessageType.SYSTEM,
      });

      expect(systemMessage.isTextMessage()).toBe(false);
      expect(systemMessage.isMediaMessage()).toBe(false);
      expect(systemMessage.isSystemMessage()).toBe(true);
    });
  });

  describe('hasMedia', () => {
    it('should return true when message has media URL', () => {
      const messageWithMedia = Message.create({
        ...mockMessageProps,
        mediaUrl: 'https://example.com/media.jpg',
      });

      expect(messageWithMedia.hasMedia()).toBe(true);
    });

    it('should return false when message has no media URL', () => {
      const messageWithoutMedia = Message.create(mockMessageProps);

      expect(messageWithoutMedia.hasMedia()).toBe(false);
    });

    it('should return false when media URL is empty string', () => {
      const messageWithEmptyMedia = Message.create({
        ...mockMessageProps,
        mediaUrl: '',
      });

      expect(messageWithEmptyMedia.hasMedia()).toBe(false);
    });
  });

  describe('getAgeInMinutes', () => {
    it('should return 0 for newly created message', () => {
      const message = Message.create(mockMessageProps);

      expect(message.getAgeInMinutes()).toBe(0);
    });

    it('should return correct age for older message', () => {
      const oldDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const message = new Message({
        ...mockMessageProps,
        id: crypto.randomUUID(),
        isRead: false,
        isEdited: false,
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      expect(message.getAgeInMinutes()).toBe(5);
    });
  });

  describe('canEditTimeWindow', () => {
    it('should allow editing within time window', () => {
      const message = Message.create(mockMessageProps);

      expect(message.canEditTimeWindow(15)).toBe(true);
    });

    it('should not allow editing outside time window', () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const message = new Message({
        ...mockMessageProps,
        id: crypto.randomUUID(),
        isRead: false,
        isEdited: false,
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      expect(message.canEditTimeWindow(15)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return message data as JSON object', () => {
      const message = Message.create(mockMessageProps);

      const json = message.toJSON();

      expect(json).toEqual({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        type: message.type,
        content: message.content,
        mediaUrl: message.mediaUrl,
        isRead: message.isRead,
        isEdited: message.isEdited,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      });
    });
  });
});
