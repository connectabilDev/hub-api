export enum DocumentType {
  CPF = 'cpf',
  RG = 'rg',
  PASSPORT = 'passport',
  SSN = 'ssn',
  NATIONAL_ID = 'national_id',
  DRIVER_LICENSE = 'driver_license',
  NI_NUMBER = 'ni_number',
}

export interface IdentityDocumentData {
  type: DocumentType;
  value: string;
  issuedBy?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

export abstract class IdentityDocument {
  protected readonly data: IdentityDocumentData;

  constructor(data: IdentityDocumentData) {
    this.data = data;
    this.validate();
  }

  protected abstract validate(): void;

  getType(): DocumentType {
    return this.data.type;
  }

  getValue(): string {
    return this.data.value;
  }

  getIssuedBy(): string | undefined {
    return this.data.issuedBy;
  }

  getIssuedDate(): Date | undefined {
    return this.data.issuedDate;
  }

  getExpiryDate(): Date | undefined {
    return this.data.expiryDate;
  }

  isExpired(): boolean {
    if (!this.data.expiryDate) return false;
    return new Date() > this.data.expiryDate;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.data.metadata;
  }

  abstract getFormattedValue(): string;

  toPlainObject(): IdentityDocumentData {
    return { ...this.data };
  }

  toString(): string {
    return this.getFormattedValue();
  }
}

export class CPFDocument extends IdentityDocument {
  protected validate(): void {
    const cleanValue = this.data.value.replace(/\D/g, '');

    if (cleanValue.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }

    if (/^(\d)\1{10}$/.test(cleanValue)) {
      throw new Error('Invalid CPF sequence');
    }

    const digits = cleanValue.split('').map(Number);
    const calculateDigit = (slice: number): number => {
      let sum = 0;
      for (let i = 0; i < slice; i++) {
        sum += digits[i] * (slice + 1 - i);
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calculateDigit(9);
    const secondDigit = calculateDigit(10);

    if (digits[9] !== firstDigit || digits[10] !== secondDigit) {
      throw new Error('Invalid CPF checksum');
    }
  }

  getFormattedValue(): string {
    const clean = this.data.value.replace(/\D/g, '');
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }
}

export class RGDocument extends IdentityDocument {
  protected validate(): void {
    const cleanValue = this.data.value.replace(/\D/g, '');

    if (cleanValue.length < 7 || cleanValue.length > 14) {
      throw new Error('RG must have between 7 and 14 digits');
    }

    if (!this.data.issuedBy) {
      throw new Error('RG issuer is required');
    }
  }

  getFormattedValue(): string {
    const clean = this.data.value.replace(/\D/g, '');
    if (clean.length === 9) {
      return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}-${clean.substring(8)}`;
    }
    return this.data.value;
  }
}

export class PassportDocument extends IdentityDocument {
  protected validate(): void {
    if (!this.data.value || this.data.value.length < 6) {
      throw new Error('Passport number must have at least 6 characters');
    }

    if (!/^[A-Z0-9]+$/i.test(this.data.value)) {
      throw new Error('Passport number must contain only letters and numbers');
    }

    if (!this.data.issuedBy) {
      throw new Error('Passport issuing country is required');
    }

    if (!this.data.expiryDate) {
      throw new Error('Passport expiry date is required');
    }

    if (this.isExpired()) {
      throw new Error('Passport is expired');
    }
  }

  getFormattedValue(): string {
    return this.data.value.toUpperCase();
  }
}

export class SSNDocument extends IdentityDocument {
  protected validate(): void {
    const cleanValue = this.data.value.replace(/\D/g, '');

    if (cleanValue.length !== 9) {
      throw new Error('SSN must have 9 digits');
    }

    if (cleanValue.substring(0, 3) === '000') {
      throw new Error('Invalid SSN area number');
    }

    if (cleanValue.substring(3, 5) === '00') {
      throw new Error('Invalid SSN group number');
    }

    if (cleanValue.substring(5) === '0000') {
      throw new Error('Invalid SSN serial number');
    }
  }

  getFormattedValue(): string {
    const clean = this.data.value.replace(/\D/g, '');
    return `${clean.substring(0, 3)}-${clean.substring(3, 5)}-${clean.substring(5)}`;
  }
}

export class NationalIDDocument extends IdentityDocument {
  protected validate(): void {
    if (!this.data.value || this.data.value.trim().length === 0) {
      throw new Error('National ID is required');
    }

    if (!this.data.issuedBy) {
      throw new Error('National ID issuing country is required');
    }
  }

  getFormattedValue(): string {
    return this.data.value.toUpperCase();
  }
}

export class NINumberDocument extends IdentityDocument {
  protected validate(): void {
    const cleanValue = this.data.value.replace(/\s/g, '').toUpperCase();

    if (!/^[A-Z]{2}\d{6}[A-Z]$/.test(cleanValue)) {
      throw new Error(
        'NI Number must be in format: 2 letters, 6 digits, 1 letter',
      );
    }

    const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
    const prefix = cleanValue.substring(0, 2);

    if (invalidPrefixes.includes(prefix)) {
      throw new Error('Invalid NI Number prefix');
    }

    const invalidSuffixes = ['D', 'F', 'I', 'Q', 'U', 'V'];
    const suffix = cleanValue.charAt(8);

    if (invalidSuffixes.includes(suffix)) {
      throw new Error('Invalid NI Number suffix');
    }
  }

  getFormattedValue(): string {
    const clean = this.data.value.replace(/\s/g, '').toUpperCase();
    return `${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 6)} ${clean.substring(6, 8)} ${clean.charAt(8)}`;
  }
}

export class IdentityDocumentFactory {
  static create(data: IdentityDocumentData): IdentityDocument {
    switch (data.type) {
      case DocumentType.CPF:
        return new CPFDocument(data);
      case DocumentType.RG:
        return new RGDocument(data);
      case DocumentType.PASSPORT:
        return new PassportDocument(data);
      case DocumentType.SSN:
        return new SSNDocument(data);
      case DocumentType.NI_NUMBER:
        return new NINumberDocument(data);
      case DocumentType.NATIONAL_ID:
      case DocumentType.DRIVER_LICENSE:
      default:
        return new NationalIDDocument(data);
    }
  }
}
