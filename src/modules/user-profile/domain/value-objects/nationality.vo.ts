export const SUPPORTED_COUNTRIES = {
  BR: { code: 'BR', name: 'Brazil', phonePrefix: '+55' },
  US: { code: 'US', name: 'United States', phonePrefix: '+1' },
  CA: { code: 'CA', name: 'Canada', phonePrefix: '+1' },
  GB: { code: 'GB', name: 'United Kingdom', phonePrefix: '+44' },
  FR: { code: 'FR', name: 'France', phonePrefix: '+33' },
  DE: { code: 'DE', name: 'Germany', phonePrefix: '+49' },
  ES: { code: 'ES', name: 'Spain', phonePrefix: '+34' },
  PT: { code: 'PT', name: 'Portugal', phonePrefix: '+351' },
  IT: { code: 'IT', name: 'Italy', phonePrefix: '+39' },
  MX: { code: 'MX', name: 'Mexico', phonePrefix: '+52' },
  AR: { code: 'AR', name: 'Argentina', phonePrefix: '+54' },
  CO: { code: 'CO', name: 'Colombia', phonePrefix: '+57' },
  CL: { code: 'CL', name: 'Chile', phonePrefix: '+56' },
  PE: { code: 'PE', name: 'Peru', phonePrefix: '+51' },
  JP: { code: 'JP', name: 'Japan', phonePrefix: '+81' },
  CN: { code: 'CN', name: 'China', phonePrefix: '+86' },
  IN: { code: 'IN', name: 'India', phonePrefix: '+91' },
  AU: { code: 'AU', name: 'Australia', phonePrefix: '+61' },
  NZ: { code: 'NZ', name: 'New Zealand', phonePrefix: '+64' },
  ZA: { code: 'ZA', name: 'South Africa', phonePrefix: '+27' },
} as const;

export type CountryCode = keyof typeof SUPPORTED_COUNTRIES;

export class Nationality {
  constructor(private readonly code: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.code || typeof this.code !== 'string') {
      throw new Error('Nationality code must be a string');
    }

    const upperCode = this.code.toUpperCase();
    if (!(upperCode in SUPPORTED_COUNTRIES)) {
      throw new Error(`Unsupported country code: ${this.code}`);
    }
  }

  getCode(): CountryCode {
    return this.code.toUpperCase() as CountryCode;
  }

  getCountryInfo() {
    return SUPPORTED_COUNTRIES[this.getCode()];
  }

  getName(): string {
    return this.getCountryInfo().name;
  }

  getPhonePrefix(): string {
    return this.getCountryInfo().phonePrefix;
  }

  isBrazilian(): boolean {
    return this.getCode() === 'BR';
  }

  requiresPassport(): boolean {
    return !this.isBrazilian();
  }

  getRequiredDocuments(): string[] {
    switch (this.getCode()) {
      case 'BR':
        return ['cpf', 'rg'];
      case 'US':
        return ['ssn', 'passport'];
      case 'GB':
        return ['ni_number', 'passport'];
      case 'CN':
        return ['national_id', 'passport'];
      default:
        return ['passport'];
    }
  }

  toString(): string {
    return this.getCode();
  }

  equals(other: Nationality): boolean {
    return this.getCode() === other.getCode();
  }
}
