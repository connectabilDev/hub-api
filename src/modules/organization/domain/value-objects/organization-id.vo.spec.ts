import { OrganizationId } from './organization-id.vo';

describe('OrganizationId', () => {
  describe('constructor', () => {
    it('should create valid organization id with alphanumeric characters', () => {
      const validIds = ['org123', 'ORG_456', 'test-org-789', 'a1b2c3'];

      validIds.forEach((id) => {
        const organizationId = new OrganizationId(id);
        expect(organizationId.getValue()).toBe(id);
        expect(organizationId.toString()).toBe(id);
      });
    });

    it('should throw error for empty organization id', () => {
      const invalidIds = ['', '   ', '\t', '\n'];

      invalidIds.forEach((id) => {
        expect(() => new OrganizationId(id)).toThrow(
          'Organization ID cannot be empty',
        );
      });
    });

    it('should throw error for organization id with invalid characters', () => {
      const invalidIds = [
        'org@123',
        'test space',
        'org!@#',
        'test.org',
        'org/123',
      ];

      invalidIds.forEach((id) => {
        expect(() => new OrganizationId(id)).toThrow(
          'Organization ID contains invalid characters',
        );
      });
    });
  });

  describe('getValue', () => {
    it('should return the original value', () => {
      const value = 'test-org-123';
      const organizationId = new OrganizationId(value);

      expect(organizationId.getValue()).toBe(value);
    });
  });

  describe('toString', () => {
    it('should return the string representation', () => {
      const value = 'test-org-456';
      const organizationId = new OrganizationId(value);

      expect(organizationId.toString()).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for same organization ids', () => {
      const id1 = new OrganizationId('test-org-123');
      const id2 = new OrganizationId('test-org-123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different organization ids', () => {
      const id1 = new OrganizationId('test-org-123');
      const id2 = new OrganizationId('test-org-456');

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('validation edge cases', () => {
    it('should accept minimum valid length', () => {
      expect(() => new OrganizationId('a')).not.toThrow();
    });

    it('should accept underscores and hyphens', () => {
      expect(() => new OrganizationId('test_org-123')).not.toThrow();
    });

    it('should reject special characters', () => {
      const specialChars = [
        '$',
        '%',
        '^',
        '&',
        '*',
        '(',
        ')',
        '+',
        '=',
        '[',
        ']',
        '{',
        '}',
        '|',
        '\\',
        ':',
        ';',
        '"',
        "'",
        '<',
        '>',
        ',',
        '.',
        '?',
        '/',
        '`',
        '~',
      ];

      specialChars.forEach((char) => {
        expect(() => new OrganizationId(`test${char}org`)).toThrow(
          'Organization ID contains invalid characters',
        );
      });
    });
  });
});
