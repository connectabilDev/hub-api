import { SchemaName } from './schema-name.vo';

describe('SchemaName', () => {
  describe('constructor', () => {
    it('should create valid schema name with lowercase letters, numbers and underscores', () => {
      const validNames = [
        'org_test',
        'organization123',
        'test_org_456',
        'a1b2c3_test',
      ];

      validNames.forEach((name) => {
        const schemaName = new SchemaName(name);
        expect(schemaName.getValue()).toBe(name);
        expect(schemaName.toString()).toBe(name);
      });
    });

    it('should throw error for empty schema name', () => {
      const invalidNames = ['', '   ', '\t', '\n'];

      invalidNames.forEach((name) => {
        expect(() => new SchemaName(name)).toThrow(
          'Schema name cannot be empty',
        );
      });
    });

    it('should throw error for schema name exceeding max length', () => {
      const longName = 'a'.repeat(64); // 64 characters, exceeds MAX_LENGTH of 63

      expect(() => new SchemaName(longName)).toThrow(
        'Schema name cannot exceed 63 characters',
      );
    });

    it('should throw error for schema name not starting with letter', () => {
      const invalidNames = ['1test', '_test', '-test', '123org'];

      invalidNames.forEach((name) => {
        expect(() => new SchemaName(name)).toThrow(
          'Schema name must start with a letter and contain only lowercase letters, numbers, and underscores',
        );
      });
    });

    it('should throw error for schema name with uppercase letters', () => {
      const invalidNames = ['Test', 'ORG', 'testOrg', 'TEST_ORG'];

      invalidNames.forEach((name) => {
        expect(() => new SchemaName(name)).toThrow(
          'Schema name must start with a letter and contain only lowercase letters, numbers, and underscores',
        );
      });
    });

    it('should throw error for schema name with invalid characters', () => {
      const invalidNames = [
        'test-org',
        'test.org',
        'test org',
        'test@org',
        'test#org',
      ];

      invalidNames.forEach((name) => {
        expect(() => new SchemaName(name)).toThrow(
          'Schema name must start with a letter and contain only lowercase letters, numbers, and underscores',
        );
      });
    });
  });

  describe('fromOrganizationId', () => {
    it('should create schema name from organization id with prefix', () => {
      const organizationId = 'test-org-123';
      const expectedSchemaName = 'org_test_org_123';

      const schemaName = SchemaName.fromOrganizationId(organizationId);

      expect(schemaName.getValue()).toBe(expectedSchemaName);
    });

    it('should replace hyphens with underscores', () => {
      const organizationId = 'test-org-with-hyphens';
      const expectedSchemaName = 'org_test_org_with_hyphens';

      const schemaName = SchemaName.fromOrganizationId(organizationId);

      expect(schemaName.getValue()).toBe(expectedSchemaName);
    });

    it('should convert to lowercase', () => {
      const organizationId = 'TEST-ORG-123';
      const expectedSchemaName = 'org_test_org_123';

      const schemaName = SchemaName.fromOrganizationId(organizationId);

      expect(schemaName.getValue()).toBe(expectedSchemaName);
    });

    it('should truncate if schema name exceeds max length', () => {
      const longOrganizationId = 'a'.repeat(60); // This will create org_aaa...aaa (64 chars total)

      const schemaName = SchemaName.fromOrganizationId(longOrganizationId);

      expect(schemaName.getValue().length).toBe(63);
      expect(schemaName.getValue().startsWith('org_')).toBe(true);
    });

    it('should handle mixed case and special characters', () => {
      const organizationId = 'Test-Org-456';
      const expectedSchemaName = 'org_test_org_456';

      const schemaName = SchemaName.fromOrganizationId(organizationId);

      expect(schemaName.getValue()).toBe(expectedSchemaName);
    });
  });

  describe('getValue', () => {
    it('should return the original value', () => {
      const value = 'org_test_schema';
      const schemaName = new SchemaName(value);

      expect(schemaName.getValue()).toBe(value);
    });
  });

  describe('toString', () => {
    it('should return the string representation', () => {
      const value = 'org_test_schema';
      const schemaName = new SchemaName(value);

      expect(schemaName.toString()).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for same schema names', () => {
      const schema1 = new SchemaName('org_test_schema');
      const schema2 = new SchemaName('org_test_schema');

      expect(schema1.equals(schema2)).toBe(true);
    });

    it('should return false for different schema names', () => {
      const schema1 = new SchemaName('org_test_schema1');
      const schema2 = new SchemaName('org_test_schema2');

      expect(schema1.equals(schema2)).toBe(false);
    });
  });

  describe('validation edge cases', () => {
    it('should accept exactly 63 characters', () => {
      const maxLengthName = 'a' + '_'.repeat(61) + 'b'; // 63 characters

      expect(() => new SchemaName(maxLengthName)).not.toThrow();
    });

    it('should accept minimum valid format', () => {
      expect(() => new SchemaName('a')).not.toThrow();
      expect(() => new SchemaName('ab')).not.toThrow();
      expect(() => new SchemaName('a1')).not.toThrow();
      expect(() => new SchemaName('a_')).not.toThrow();
    });

    it('should handle complex valid patterns', () => {
      const validPatterns = [
        'org_test_123',
        'a1b2c3',
        'test_organization_with_numbers_123',
        'z',
      ];

      validPatterns.forEach((pattern) => {
        expect(() => new SchemaName(pattern)).not.toThrow();
      });
    });

    it('should reject various invalid patterns', () => {
      const invalidPatterns = [
        '1abc', // starts with number
        '_abc', // starts with underscore
        'Abc', // uppercase
        'abc-def', // hyphen
        'abc def', // space
        'abc.def', // dot
        'abc@def', // special char
      ];

      invalidPatterns.forEach((pattern) => {
        expect(() => new SchemaName(pattern)).toThrow();
      });
    });
  });

  describe('integration with organization ids', () => {
    it('should handle typical organization id patterns', () => {
      const testCases = [
        { orgId: 'company-123', expected: 'org_company_123' },
        { orgId: 'ACME-Corp', expected: 'org_acme_corp' },
        {
          orgId: 'test-org-with-long-name',
          expected: 'org_test_org_with_long_name',
        },
        { orgId: 'simple', expected: 'org_simple' },
      ];

      testCases.forEach(({ orgId, expected }) => {
        const schemaName = SchemaName.fromOrganizationId(orgId);
        expect(schemaName.getValue()).toBe(expected);
      });
    });
  });
});
