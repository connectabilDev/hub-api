import { Organization, OrganizationStatus } from './organization.entity';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { SchemaName } from '../value-objects/schema-name.vo';

describe('Organization', () => {
  const mockDate = new Date('2024-01-01T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create organization with all parameters', () => {
      const id = new OrganizationId('test-org');
      const schemaName = new SchemaName('org_test_org');
      const name = 'Test Organization';
      const description = 'Test description';
      const status = OrganizationStatus.ACTIVE;
      const createdAt = new Date('2023-01-01');
      const provisionedAt = new Date('2023-01-02');

      const organization = new Organization(
        id,
        schemaName,
        name,
        description,
        status,
        createdAt,
        provisionedAt,
      );

      expect(organization.getId()).toBe('test-org');
      expect(organization.getSchemaName()).toBe('org_test_org');
      expect(organization.getName()).toBe(name);
      expect(organization.getDescription()).toBe(description);
      expect(organization.getStatus()).toBe(status);
      expect(organization.getCreatedAt()).toBe(createdAt);
      expect(organization.getProvisionedAt()).toBe(provisionedAt);
    });

    it('should create organization with minimal parameters', () => {
      const id = new OrganizationId('test-org');
      const schemaName = new SchemaName('org_test_org');
      const name = 'Test Organization';

      const organization = new Organization(id, schemaName, name);

      expect(organization.getId()).toBe('test-org');
      expect(organization.getName()).toBe(name);
      expect(organization.getStatus()).toBe(OrganizationStatus.PROVISIONING);
      expect(organization.getDescription()).toBeUndefined();
      expect(organization.getCreatedAt()).toBeUndefined();
      expect(organization.getProvisionedAt()).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create new organization with default status', () => {
      const organization = Organization.create(
        'test-org-123',
        'Test Organization',
      );

      expect(organization.getId()).toBe('test-org-123');
      expect(organization.getSchemaName()).toBe('org_test_org_123');
      expect(organization.getName()).toBe('Test Organization');
      expect(organization.getStatus()).toBe(OrganizationStatus.PROVISIONING);
      expect(organization.getCreatedAt()).toEqual(mockDate);
      expect(organization.getDescription()).toBeUndefined();
    });

    it('should create new organization with description', () => {
      const description = 'Test organization description';
      const organization = Organization.create(
        'test-org-456',
        'Test Organization',
        description,
      );

      expect(organization.getId()).toBe('test-org-456');
      expect(organization.getName()).toBe('Test Organization');
      expect(organization.getDescription()).toBe(description);
      expect(organization.getStatus()).toBe(OrganizationStatus.PROVISIONING);
      expect(organization.getCreatedAt()).toEqual(mockDate);
    });

    it('should auto-generate schema name from organization id', () => {
      const organization = Organization.create(
        'ACME-Corp-123',
        'ACME Corporation',
      );

      expect(organization.getSchemaName()).toBe('org_acme_corp_123');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute organization from persistence data', () => {
      const createdAt = new Date('2023-01-01');
      const provisionedAt = new Date('2023-01-02');

      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        'Test description',
        OrganizationStatus.ACTIVE,
        createdAt,
        provisionedAt,
      );

      expect(organization.getId()).toBe('test-org');
      expect(organization.getSchemaName()).toBe('org_test_org');
      expect(organization.getName()).toBe('Test Organization');
      expect(organization.getDescription()).toBe('Test description');
      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);
      expect(organization.getCreatedAt()).toBe(createdAt);
      expect(organization.getProvisionedAt()).toBe(provisionedAt);
    });

    it('should reconstitute organization without optional fields', () => {
      const createdAt = new Date('2023-01-01');

      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.PROVISIONING,
        createdAt,
      );

      expect(organization.getId()).toBe('test-org');
      expect(organization.getDescription()).toBeUndefined();
      expect(organization.getProvisionedAt()).toBeUndefined();
    });
  });

  describe('markAsProvisioned', () => {
    it('should mark provisioning organization as provisioned', () => {
      const organization = Organization.create('test-org', 'Test Organization');

      expect(organization.getStatus()).toBe(OrganizationStatus.PROVISIONING);
      expect(organization.getProvisionedAt()).toBeUndefined();

      organization.markAsProvisioned();

      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);
      expect(organization.getProvisionedAt()).toEqual(mockDate);
    });

    it('should throw error when trying to mark non-provisioning organization as provisioned', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      expect(() => organization.markAsProvisioned()).toThrow(
        'Only provisioning organizations can be marked as provisioned',
      );
    });

    it('should throw error when trying to mark suspended organization as provisioned', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date(),
      );

      expect(() => organization.markAsProvisioned()).toThrow(
        'Only provisioning organizations can be marked as provisioned',
      );
    });
  });

  describe('suspend', () => {
    it('should suspend active organization', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      organization.suspend();

      expect(organization.getStatus()).toBe(OrganizationStatus.SUSPENDED);
    });

    it('should throw error when trying to suspend non-active organization', () => {
      const organization = Organization.create('test-org', 'Test Organization');

      expect(() => organization.suspend()).toThrow(
        'Only active organizations can be suspended',
      );
    });

    it('should throw error when trying to suspend already suspended organization', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date(),
      );

      expect(() => organization.suspend()).toThrow(
        'Only active organizations can be suspended',
      );
    });
  });

  describe('reactivate', () => {
    it('should reactivate suspended organization', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.SUSPENDED,
        new Date(),
      );

      organization.reactivate();

      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should throw error when trying to reactivate non-suspended organization', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      expect(() => organization.reactivate()).toThrow(
        'Only suspended organizations can be reactivated',
      );
    });

    it('should throw error when trying to reactivate provisioning organization', () => {
      const organization = Organization.create('test-org', 'Test Organization');

      expect(() => organization.reactivate()).toThrow(
        'Only suspended organizations can be reactivated',
      );
    });
  });

  describe('isActive', () => {
    it('should return true for active organization', () => {
      const organization = Organization.reconstitute(
        'test-org',
        'org_test_org',
        'Test Organization',
        undefined,
        OrganizationStatus.ACTIVE,
        new Date(),
      );

      expect(organization.isActive()).toBe(true);
    });

    it('should return false for non-active organization', () => {
      const statuses = [
        OrganizationStatus.PROVISIONING,
        OrganizationStatus.SUSPENDED,
        OrganizationStatus.DELETED,
      ];

      statuses.forEach((status) => {
        const organization = Organization.reconstitute(
          'test-org',
          'org_test_org',
          'Test Organization',
          undefined,
          status,
          new Date(),
        );

        expect(organization.isActive()).toBe(false);
      });
    });
  });

  describe('isProvisioning', () => {
    it('should return true for provisioning organization', () => {
      const organization = Organization.create('test-org', 'Test Organization');

      expect(organization.isProvisioning()).toBe(true);
    });

    it('should return false for non-provisioning organization', () => {
      const statuses = [
        OrganizationStatus.ACTIVE,
        OrganizationStatus.SUSPENDED,
        OrganizationStatus.DELETED,
      ];

      statuses.forEach((status) => {
        const organization = Organization.reconstitute(
          'test-org',
          'org_test_org',
          'Test Organization',
          undefined,
          status,
          new Date(),
        );

        expect(organization.isProvisioning()).toBe(false);
      });
    });
  });

  describe('status transitions', () => {
    it('should allow valid status transitions', () => {
      const organization = Organization.create('test-org', 'Test Organization');

      // PROVISIONING -> ACTIVE
      expect(organization.getStatus()).toBe(OrganizationStatus.PROVISIONING);
      organization.markAsProvisioned();
      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);

      // ACTIVE -> SUSPENDED
      organization.suspend();
      expect(organization.getStatus()).toBe(OrganizationStatus.SUSPENDED);

      // SUSPENDED -> ACTIVE
      organization.reactivate();
      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should prevent invalid status transitions', () => {
      // Test all invalid transitions
      const organization = Organization.create('test-org', 'Test Organization');

      // Cannot suspend from PROVISIONING
      expect(() => organization.suspend()).toThrow();

      // Cannot reactivate from PROVISIONING
      expect(() => organization.reactivate()).toThrow();
    });
  });

  describe('getters', () => {
    let organization: Organization;

    beforeEach(() => {
      const createdAt = new Date('2023-01-01');
      const provisionedAt = new Date('2023-01-02');

      organization = Organization.reconstitute(
        'test-org-123',
        'org_test_org_123',
        'Test Organization',
        'Test description',
        OrganizationStatus.ACTIVE,
        createdAt,
        provisionedAt,
      );
    });

    it('should return correct id', () => {
      expect(organization.getId()).toBe('test-org-123');
    });

    it('should return correct schema name', () => {
      expect(organization.getSchemaName()).toBe('org_test_org_123');
    });

    it('should return correct name', () => {
      expect(organization.getName()).toBe('Test Organization');
    });

    it('should return correct description', () => {
      expect(organization.getDescription()).toBe('Test description');
    });

    it('should return correct status', () => {
      expect(organization.getStatus()).toBe(OrganizationStatus.ACTIVE);
    });

    it('should return correct created at', () => {
      expect(organization.getCreatedAt()).toEqual(new Date('2023-01-01'));
    });

    it('should return correct provisioned at', () => {
      expect(organization.getProvisionedAt()).toEqual(new Date('2023-01-02'));
    });
  });
});
