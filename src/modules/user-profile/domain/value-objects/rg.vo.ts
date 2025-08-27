export class RG {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('RG must be a string');
    }

    const cleanRg = this.value.replace(/\D/g, '');

    if (cleanRg.length < 5 || cleanRg.length > 15) {
      throw new Error('RG must have between 5 and 15 digits');
    }

    if (!/^[0-9]+$/.test(cleanRg)) {
      throw new Error('RG must contain only numbers');
    }
  }

  getValue(): string {
    return this.value;
  }

  getCleanValue(): string {
    return this.value.replace(/\D/g, '');
  }

  toString(): string {
    return this.value;
  }

  equals(other: RG): boolean {
    return this.getCleanValue() === other.getCleanValue();
  }
}
