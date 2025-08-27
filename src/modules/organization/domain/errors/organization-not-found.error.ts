export class OrganizationNotFoundError extends Error {
  constructor(organizationId: string) {
    super(`Organization with ID ${organizationId} not found`);
    this.name = 'OrganizationNotFoundError';
  }
}

export class OrganizationAlreadyExistsError extends Error {
  constructor(organizationId: string) {
    super(`Organization with ID ${organizationId} already exists`);
    this.name = 'OrganizationAlreadyExistsError';
  }
}

export class OrganizationProvisioningError extends Error {
  constructor(organizationId: string, reason?: string) {
    super(
      `Failed to provision organization ${organizationId}${reason ? `: ${reason}` : ''}`,
    );
    this.name = 'OrganizationProvisioningError';
  }
}

export class InvalidOrganizationStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationStatusError';
  }
}
