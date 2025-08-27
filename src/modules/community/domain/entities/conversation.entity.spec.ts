import { Conversation, ConversationType } from './conversation.entity';

describe('Conversation Entity', () => {
  const directConversationProps = {
    type: ConversationType.DIRECT,
    participantIds: ['user-1', 'user-2'],
  };

  const groupConversationProps = {
    type: ConversationType.GROUP,
    name: 'Test Group Chat',
    participantIds: ['user-1', 'user-2', 'user-3'],
  };

  describe('create', () => {
    it('should create a direct conversation', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(conversation.id).toBeDefined();
      expect(conversation.type).toBe(ConversationType.DIRECT);
      expect(conversation.participantIds).toEqual(['user-1', 'user-2']);
      expect(conversation.name).toBeUndefined();
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a group conversation', () => {
      const conversation = Conversation.create(groupConversationProps);

      expect(conversation.id).toBeDefined();
      expect(conversation.type).toBe(ConversationType.GROUP);
      expect(conversation.participantIds).toEqual([
        'user-1',
        'user-2',
        'user-3',
      ]);
      expect(conversation.name).toBe('Test Group Chat');
      expect(conversation.createdAt).toBeInstanceOf(Date);
      expect(conversation.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for direct conversation with wrong participant count', () => {
      const invalidDirectProps = {
        type: ConversationType.DIRECT,
        participantIds: ['user-1'],
      };

      expect(() => Conversation.create(invalidDirectProps)).toThrow(
        'Direct conversations must have exactly 2 participants',
      );
    });

    it('should throw error for group conversation with less than 3 participants', () => {
      const invalidGroupProps = {
        type: ConversationType.GROUP,
        name: 'Test Group',
        participantIds: ['user-1', 'user-2'],
      };

      expect(() => Conversation.create(invalidGroupProps)).toThrow(
        'Group conversations must have at least 3 participants',
      );
    });
  });

  describe('type checks', () => {
    it('should correctly identify direct conversations', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(conversation.isDirect()).toBe(true);
      expect(conversation.isGroup()).toBe(false);
    });

    it('should correctly identify group conversations', () => {
      const conversation = Conversation.create(groupConversationProps);

      expect(conversation.isDirect()).toBe(false);
      expect(conversation.isGroup()).toBe(true);
    });
  });

  describe('hasParticipant', () => {
    it('should return true if user is participant', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(conversation.hasParticipant('user-1')).toBe(true);
      expect(conversation.hasParticipant('user-2')).toBe(true);
    });

    it('should return false if user is not participant', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(conversation.hasParticipant('user-3')).toBe(false);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to group conversation', () => {
      const conversation = Conversation.create(groupConversationProps);

      const updatedConversation = conversation.addParticipant('user-4');

      expect(updatedConversation.participantIds).toContain('user-4');
      expect(updatedConversation.getParticipantCount()).toBe(4);
    });

    it('should not duplicate existing participants', () => {
      const conversation = Conversation.create(groupConversationProps);

      const updatedConversation = conversation.addParticipant('user-1');

      expect(updatedConversation.getParticipantCount()).toBe(3);
    });

    it('should throw error when adding participant to direct conversation', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(() => conversation.addParticipant('user-3')).toThrow(
        'Cannot add participants to direct conversations',
      );
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from group conversation', () => {
      const conversation = Conversation.create(groupConversationProps);

      const updatedConversation = conversation.removeParticipant('user-3');

      expect(updatedConversation.participantIds).not.toContain('user-3');
      expect(updatedConversation.getParticipantCount()).toBe(2);
    });

    it('should not affect conversation if participant does not exist', () => {
      const conversation = Conversation.create(groupConversationProps);

      const updatedConversation = conversation.removeParticipant('user-999');

      expect(updatedConversation.getParticipantCount()).toBe(3);
    });

    it('should throw error when removing participant from direct conversation', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(() => conversation.removeParticipant('user-1')).toThrow(
        'Cannot remove participants from direct conversations',
      );
    });

    it('should throw error if removing participant would leave less than 2 participants', () => {
      const minimalGroupProps = {
        type: ConversationType.GROUP,
        name: 'Minimal Group',
        participantIds: ['user-1', 'user-2', 'user-3'],
      };
      const conversation = Conversation.create(minimalGroupProps);
      const reducedConversation = conversation.removeParticipant('user-3');

      expect(() => reducedConversation.removeParticipant('user-2')).toThrow(
        'Conversation must have at least 2 participants',
      );
    });
  });

  describe('updateName', () => {
    it('should update name of group conversation', () => {
      const conversation = Conversation.create(groupConversationProps);
      const newName = 'Updated Group Name';

      const updatedConversation = conversation.updateName(newName);

      expect(updatedConversation.name).toBe(newName);
    });

    it('should throw error when updating name of direct conversation', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(() => conversation.updateName('New Name')).toThrow(
        'Cannot update name of direct conversations',
      );
    });
  });

  describe('getOtherParticipant', () => {
    it('should return other participant in direct conversation', () => {
      const conversation = Conversation.create(directConversationProps);

      expect(conversation.getOtherParticipant('user-1')).toBe('user-2');
      expect(conversation.getOtherParticipant('user-2')).toBe('user-1');
    });

    it('should return undefined for group conversations', () => {
      const conversation = Conversation.create(groupConversationProps);

      expect(conversation.getOtherParticipant('user-1')).toBeUndefined();
    });
  });

  describe('getParticipantCount', () => {
    it('should return correct participant count', () => {
      const directConversation = Conversation.create(directConversationProps);
      const groupConversation = Conversation.create(groupConversationProps);

      expect(directConversation.getParticipantCount()).toBe(2);
      expect(groupConversation.getParticipantCount()).toBe(3);
    });
  });

  describe('toJSON', () => {
    it('should return conversation data as JSON object', () => {
      const conversation = Conversation.create(groupConversationProps);

      const json = conversation.toJSON();

      expect(json).toEqual({
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        participantIds: conversation.participantIds,
        participantCount: conversation.getParticipantCount(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      });
    });
  });
});
