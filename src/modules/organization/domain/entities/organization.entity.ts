import { OrganizationId } from '../value-objects/organization-id.vo';
import { SchemaName } from '../value-objects/schema-name.vo';

export enum OrganizationStatus {
  PROVISIONING = 'provisioning',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export class Organization {
  private status: OrganizationStatus;
  private provisionedAt?: Date;

  constructor(
    private readonly id: OrganizationId,
    private readonly schemaName: SchemaName,
    private readonly name: string,
    private readonly description?: string,
    status?: OrganizationStatus,
    private readonly createdAt?: Date,
    provisionedAt?: Date,
  ) {
    this.status = status || OrganizationStatus.PROVISIONING;
    this.provisionedAt = provisionedAt;
  }

  static create(id: string, name: string, description?: string): Organization {
    return new Organization(
      new OrganizationId(id),
      SchemaName.fromOrganizationId(id),
      name,
      description,
      OrganizationStatus.PROVISIONING,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    schemaName: string,
    name: string,
    description: string | undefined,
    status: OrganizationStatus,
    createdAt: Date,
    provisionedAt?: Date,
  ): Organization {
    return new Organization(
      new OrganizationId(id),
      new SchemaName(schemaName),
      name,
      description,
      status,
      createdAt,
      provisionedAt,
    );
  }

  markAsProvisioned(): void {
    if (this.status !== OrganizationStatus.PROVISIONING) {
      throw new Error(
        'Only provisioning organizations can be marked as provisioned',
      );
    }
    this.status = OrganizationStatus.ACTIVE;
    this.provisionedAt = new Date();
  }

  suspend(): void {
    if (this.status !== OrganizationStatus.ACTIVE) {
      throw new Error('Only active organizations can be suspended');
    }
    this.status = OrganizationStatus.SUSPENDED;
  }

  reactivate(): void {
    if (this.status !== OrganizationStatus.SUSPENDED) {
      throw new Error('Only suspended organizations can be reactivated');
    }
    this.status = OrganizationStatus.ACTIVE;
  }

  getId(): string {
    return this.id.getValue();
  }

  getSchemaName(): string {
    return this.schemaName.getValue();
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getStatus(): OrganizationStatus {
    return this.status;
  }

  getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  getProvisionedAt(): Date | undefined {
    return this.provisionedAt;
  }

  isActive(): boolean {
    return this.status === OrganizationStatus.ACTIVE;
  }

  isProvisioning(): boolean {
    return this.status === OrganizationStatus.PROVISIONING;
  }
}
