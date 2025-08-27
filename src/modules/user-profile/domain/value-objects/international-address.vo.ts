import { CountryCode } from './nationality.vo';

export interface InternationalAddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince?: string;
  postalCode?: string;
  countryCode: CountryCode;
  additionalInfo?: Record<string, any>;
}

export class InternationalAddress {
  constructor(private readonly data: InternationalAddressData) {
    this.validate();
  }

  private validate(): void {
    if (!this.data.addressLine1 || this.data.addressLine1.trim().length === 0) {
      throw new Error('Address line 1 is required');
    }

    if (!this.data.city || this.data.city.trim().length === 0) {
      throw new Error('City is required');
    }

    if (!this.data.countryCode) {
      throw new Error('Country code is required');
    }

    this.validateByCountry();
  }

  private validateByCountry(): void {
    switch (this.data.countryCode) {
      case 'BR':
        this.validateBrazilianAddress();
        break;
      case 'US':
      case 'CA':
        this.validateNorthAmericanAddress();
        break;
      case 'GB':
        this.validateUKAddress();
        break;
      case 'JP':
        this.validateJapaneseAddress();
        break;
      case 'CN':
        this.validateChineseAddress();
        break;
      default:
        break;
    }
  }

  private validateBrazilianAddress(): void {
    if (!this.data.postalCode) {
      throw new Error('CEP is required for Brazilian addresses');
    }

    const cleanCep = this.data.postalCode.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new Error('Brazilian CEP must have 8 digits');
    }

    if (!this.data.stateOrProvince) {
      throw new Error('State is required for Brazilian addresses');
    }

    const validStates = [
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ];

    if (!validStates.includes(this.data.stateOrProvince.toUpperCase())) {
      throw new Error('Invalid Brazilian state code');
    }
  }

  private validateNorthAmericanAddress(): void {
    if (!this.data.stateOrProvince) {
      throw new Error(
        'State/Province is required for North American addresses',
      );
    }

    if (!this.data.postalCode) {
      throw new Error('Postal code is required for North American addresses');
    }

    if (this.data.countryCode === 'US') {
      const cleanZip = this.data.postalCode.replace(/\D/g, '');
      if (cleanZip.length !== 5 && cleanZip.length !== 9) {
        throw new Error('US ZIP code must have 5 or 9 digits');
      }
    }

    if (this.data.countryCode === 'CA') {
      const postalCodePattern = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
      if (!postalCodePattern.test(this.data.postalCode)) {
        throw new Error('Invalid Canadian postal code format');
      }
    }
  }

  private validateUKAddress(): void {
    if (!this.data.postalCode) {
      throw new Error('Postcode is required for UK addresses');
    }

    const postcodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodePattern.test(this.data.postalCode)) {
      throw new Error('Invalid UK postcode format');
    }
  }

  private validateJapaneseAddress(): void {
    if (!this.data.postalCode) {
      throw new Error('Postal code is required for Japanese addresses');
    }

    const cleanPostalCode = this.data.postalCode.replace(/\D/g, '');
    if (cleanPostalCode.length !== 7) {
      throw new Error('Japanese postal code must have 7 digits');
    }

    if (!this.data.stateOrProvince) {
      throw new Error('Prefecture is required for Japanese addresses');
    }
  }

  private validateChineseAddress(): void {
    if (!this.data.stateOrProvince) {
      throw new Error('Province is required for Chinese addresses');
    }

    if (!this.data.postalCode) {
      throw new Error('Postal code is required for Chinese addresses');
    }

    const cleanPostalCode = this.data.postalCode.replace(/\D/g, '');
    if (cleanPostalCode.length !== 6) {
      throw new Error('Chinese postal code must have 6 digits');
    }
  }

  getAddressLine1(): string {
    return this.data.addressLine1;
  }

  getAddressLine2(): string | undefined {
    return this.data.addressLine2;
  }

  getCity(): string {
    return this.data.city;
  }

  getStateOrProvince(): string | undefined {
    return this.data.stateOrProvince;
  }

  getPostalCode(): string | undefined {
    return this.data.postalCode;
  }

  getCountryCode(): CountryCode {
    return this.data.countryCode;
  }

  getFormattedPostalCode(): string | undefined {
    if (!this.data.postalCode) return undefined;

    switch (this.data.countryCode) {
      case 'BR': {
        const cleanCep = this.data.postalCode.replace(/\D/g, '');
        return `${cleanCep.substring(0, 5)}-${cleanCep.substring(5)}`;
      }
      case 'US': {
        const cleanZip = this.data.postalCode.replace(/\D/g, '');
        if (cleanZip.length === 9) {
          return `${cleanZip.substring(0, 5)}-${cleanZip.substring(5)}`;
        }
        return cleanZip;
      }
      case 'CA':
        return this.data.postalCode.toUpperCase();
      case 'GB':
        return this.data.postalCode.toUpperCase();
      case 'JP': {
        const cleanJp = this.data.postalCode.replace(/\D/g, '');
        return `${cleanJp.substring(0, 3)}-${cleanJp.substring(3)}`;
      }
      default:
        return this.data.postalCode;
    }
  }

  getFullAddress(includeCountry = true): string {
    const parts = [
      this.data.addressLine1,
      this.data.addressLine2,
      this.data.city,
      this.data.stateOrProvince,
      this.getFormattedPostalCode(),
    ].filter((part) => part && part.trim().length > 0);

    if (includeCountry) {
      parts.push(this.data.countryCode);
    }

    return parts.join(', ');
  }

  getLocalizedFormat(): string {
    switch (this.data.countryCode) {
      case 'BR':
        return this.getBrazilianFormat();
      case 'US':
        return this.getUSFormat();
      case 'JP':
        return this.getJapaneseFormat();
      case 'CN':
        return this.getChineseFormat();
      default:
        return this.getFullAddress();
    }
  }

  private getBrazilianFormat(): string {
    const parts = [
      this.data.addressLine1,
      this.data.addressLine2,
      `${this.data.city}/${this.data.stateOrProvince}`,
      this.getFormattedPostalCode(),
      'Brasil',
    ].filter(
      (part): part is string => part !== undefined && part.trim().length > 0,
    );

    return parts.join(', ');
  }

  private getUSFormat(): string {
    const parts = [
      this.data.addressLine1,
      this.data.addressLine2,
      `${this.data.city}, ${this.data.stateOrProvince} ${this.data.postalCode}`,
      'USA',
    ].filter(
      (part): part is string => part !== undefined && part.trim().length > 0,
    );

    return parts.join('\n');
  }

  private getJapaneseFormat(): string {
    return `〒${this.getFormattedPostalCode()} ${this.data.stateOrProvince} ${this.data.city} ${this.data.addressLine1}`;
  }

  private getChineseFormat(): string {
    return `${this.data.countryCode} ${this.data.postalCode} ${this.data.stateOrProvince} ${this.data.city} ${this.data.addressLine1}`;
  }

  toPlainObject(): InternationalAddressData {
    return { ...this.data };
  }

  toString(): string {
    return this.getLocalizedFormat();
  }

  equals(other: InternationalAddress): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}
