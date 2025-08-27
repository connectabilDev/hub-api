import { GroupPrivacy, GroupPrivacyType } from './group-privacy.vo';

describe('GroupPrivacy', () => {
  describe('fromString', () => {
    it('should create from valid string values', () => {
      const publicPrivacy = GroupPrivacy.fromString('PUBLIC');
      expect(publicPrivacy.getValue()).toBe(GroupPrivacyType.PUBLIC);

      const privatePrivacy = GroupPrivacy.fromString('private');
      expect(privatePrivacy.getValue()).toBe(GroupPrivacyType.PRIVATE);

      const secretPrivacy = GroupPrivacy.fromString('Secret');
      expect(secretPrivacy.getValue()).toBe(GroupPrivacyType.SECRET);
    });

    it('should throw error for invalid values', () => {
      expect(() => GroupPrivacy.fromString('INVALID')).toThrow(
        'Invalid group privacy: INVALID',
      );
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(GroupPrivacy.isValid('PUBLIC')).toBe(true);
      expect(GroupPrivacy.isValid('PRIVATE')).toBe(true);
      expect(GroupPrivacy.isValid('SECRET')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(GroupPrivacy.isValid('INVALID')).toBe(false);
      expect(GroupPrivacy.isValid('')).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create public privacy', () => {
      const privacy = GroupPrivacy.createPublic();
      expect(privacy.isPublic()).toBe(true);
    });

    it('should create private privacy', () => {
      const privacy = GroupPrivacy.createPrivate();
      expect(privacy.isPrivate()).toBe(true);
    });

    it('should create secret privacy', () => {
      const privacy = GroupPrivacy.createSecret();
      expect(privacy.isSecret()).toBe(true);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify public groups', () => {
      const privacy = GroupPrivacy.createPublic();
      expect(privacy.isPublic()).toBe(true);
      expect(privacy.isPrivate()).toBe(false);
      expect(privacy.isSecret()).toBe(false);
    });

    it('should correctly identify private groups', () => {
      const privacy = GroupPrivacy.createPrivate();
      expect(privacy.isPublic()).toBe(false);
      expect(privacy.isPrivate()).toBe(true);
      expect(privacy.isSecret()).toBe(false);
    });

    it('should correctly identify secret groups', () => {
      const privacy = GroupPrivacy.createSecret();
      expect(privacy.isPublic()).toBe(false);
      expect(privacy.isPrivate()).toBe(false);
      expect(privacy.isSecret()).toBe(true);
    });
  });

  describe('permission methods', () => {
    describe('canDiscoverGroup', () => {
      it('should allow discovery of public groups only', () => {
        expect(GroupPrivacy.createPublic().canDiscoverGroup()).toBe(true);
        expect(GroupPrivacy.createPrivate().canDiscoverGroup()).toBe(false);
        expect(GroupPrivacy.createSecret().canDiscoverGroup()).toBe(false);
      });
    });

    describe('canRequestToJoin', () => {
      it('should allow join requests for public and private groups', () => {
        expect(GroupPrivacy.createPublic().canRequestToJoin()).toBe(true);
        expect(GroupPrivacy.createPrivate().canRequestToJoin()).toBe(true);
        expect(GroupPrivacy.createSecret().canRequestToJoin()).toBe(false);
      });
    });

    describe('canViewBasicInfo', () => {
      it('should allow viewing basic info for non-secret groups', () => {
        expect(GroupPrivacy.createPublic().canViewBasicInfo()).toBe(true);
        expect(GroupPrivacy.createPrivate().canViewBasicInfo()).toBe(true);
        expect(GroupPrivacy.createSecret().canViewBasicInfo()).toBe(false);
      });
    });

    describe('canViewContent', () => {
      it('should allow content viewing based on privacy and membership', () => {
        const publicPrivacy = GroupPrivacy.createPublic();
        expect(publicPrivacy.canViewContent(true)).toBe(true);
        expect(publicPrivacy.canViewContent(false)).toBe(true);

        const privatePrivacy = GroupPrivacy.createPrivate();
        expect(privatePrivacy.canViewContent(true)).toBe(true);
        expect(privatePrivacy.canViewContent(false)).toBe(false);

        const secretPrivacy = GroupPrivacy.createSecret();
        expect(secretPrivacy.canViewContent(true)).toBe(true);
        expect(secretPrivacy.canViewContent(false)).toBe(false);
      });
    });
  });

  describe('equals', () => {
    it('should return true for same privacy types', () => {
      const privacy1 = GroupPrivacy.createPublic();
      const privacy2 = GroupPrivacy.createPublic();
      expect(privacy1.equals(privacy2)).toBe(true);
    });

    it('should return false for different privacy types', () => {
      const privacy1 = GroupPrivacy.createPublic();
      const privacy2 = GroupPrivacy.createPrivate();
      expect(privacy1.equals(privacy2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const privacy = GroupPrivacy.createSecret();
      expect(privacy.toString()).toBe('SECRET');
    });
  });
});
