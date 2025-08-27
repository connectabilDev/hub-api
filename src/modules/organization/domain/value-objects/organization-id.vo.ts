export class OrganizationId {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Organization ID cannot be empty');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(this.value)) {
      throw new Error('Organization ID contains invalid characters');
    }
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }
}
