export class SchemaName {
  private static readonly PREFIX = 'org_';
  private static readonly MAX_LENGTH = 63;

  constructor(private readonly value: string) {
    this.validate();
  }

  static fromOrganizationId(organizationId: string): SchemaName {
    const sanitized = organizationId.replace(/-/g, '_').toLowerCase();
    const schemaName = `${SchemaName.PREFIX}${sanitized}`;

    if (schemaName.length > SchemaName.MAX_LENGTH) {
      const truncated = schemaName.substring(0, SchemaName.MAX_LENGTH);
      return new SchemaName(truncated);
    }

    return new SchemaName(schemaName);
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Schema name cannot be empty');
    }

    if (this.value.length > SchemaName.MAX_LENGTH) {
      throw new Error(
        `Schema name cannot exceed ${SchemaName.MAX_LENGTH} characters`,
      );
    }

    if (!/^[a-z][a-z0-9_]*$/.test(this.value)) {
      throw new Error(
        'Schema name must start with a letter and contain only lowercase letters, numbers, and underscores',
      );
    }
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: SchemaName): boolean {
    return this.value === other.value;
  }
}
