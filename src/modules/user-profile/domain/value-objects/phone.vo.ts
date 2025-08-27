export class Phone {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Phone must be a string');
    }

    const cleanPhone = this.value.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new Error('Phone must have 10 or 11 digits');
    }

    if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
      throw new Error('Mobile phone must start with 9 after area code');
    }

    if (!/^[0-9]+$/.test(cleanPhone)) {
      throw new Error('Phone must contain only numbers');
    }
  }

  getValue(): string {
    return this.value;
  }

  getCleanValue(): string {
    return this.value.replace(/\D/g, '');
  }

  getFormattedValue(): string {
    const clean = this.getCleanValue();

    if (clean.length === 10) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
    } else {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
  }

  toString(): string {
    return this.getFormattedValue();
  }

  equals(other: Phone): boolean {
    return this.getCleanValue() === other.getCleanValue();
  }

  isMobile(): boolean {
    const clean = this.getCleanValue();
    return clean.length === 11 && clean.charAt(2) === '9';
  }
}
