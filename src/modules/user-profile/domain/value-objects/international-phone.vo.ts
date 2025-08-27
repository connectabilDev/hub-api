import { CountryCode, SUPPORTED_COUNTRIES } from './nationality.vo';

export class InternationalPhone {
  private readonly countryCode: CountryCode;
  private readonly nationalNumber: string;

  constructor(value: string, countryCode?: CountryCode) {
    const parsed = this.parsePhoneNumber(value, countryCode);
    this.countryCode = parsed.countryCode;
    this.nationalNumber = parsed.nationalNumber;
    this.validate();
  }

  private parsePhoneNumber(
    value: string,
    countryCode?: CountryCode,
  ): { countryCode: CountryCode; nationalNumber: string } {
    const cleanValue = value.replace(/[\s\-().]/g, '');

    if (cleanValue.startsWith('+')) {
      for (const [code, country] of Object.entries(SUPPORTED_COUNTRIES)) {
        const prefix = country.phonePrefix.replace('+', '');
        if (cleanValue.startsWith('+' + prefix)) {
          return {
            countryCode: code as CountryCode,
            nationalNumber: cleanValue.substring(prefix.length + 1),
          };
        }
      }
      throw new Error('Unsupported country phone prefix');
    }

    if (!countryCode) {
      throw new Error(
        'Country code is required when phone number does not include international prefix',
      );
    }

    return {
      countryCode,
      nationalNumber: cleanValue,
    };
  }

  private validate(): void {
    if (!this.nationalNumber || !/^\d+$/.test(this.nationalNumber)) {
      throw new Error('Phone number must contain only digits');
    }

    this.validateByCountry();
  }

  private validateByCountry(): void {
    switch (this.countryCode) {
      case 'BR':
        this.validateBrazilianPhone();
        break;
      case 'US':
      case 'CA':
        this.validateNorthAmericanPhone();
        break;
      case 'GB':
        this.validateUKPhone();
        break;
      case 'FR':
        this.validateFrenchPhone();
        break;
      case 'DE':
        this.validateGermanPhone();
        break;
      case 'JP':
        this.validateJapanesePhone();
        break;
      case 'CN':
        this.validateChinesePhone();
        break;
      case 'IN':
        this.validateIndianPhone();
        break;
      default:
        if (this.nationalNumber.length < 7 || this.nationalNumber.length > 15) {
          throw new Error('Phone number must have between 7 and 15 digits');
        }
    }
  }

  private validateBrazilianPhone(): void {
    if (
      this.nationalNumber.length !== 10 &&
      this.nationalNumber.length !== 11
    ) {
      throw new Error('Brazilian phone must have 10 or 11 digits');
    }

    if (
      this.nationalNumber.length === 11 &&
      this.nationalNumber.charAt(2) !== '9'
    ) {
      throw new Error('Brazilian mobile must have 9 as third digit');
    }
  }

  private validateNorthAmericanPhone(): void {
    if (this.nationalNumber.length !== 10) {
      throw new Error('North American phone must have 10 digits');
    }

    const areaCode = this.nationalNumber.substring(0, 3);
    if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
      throw new Error('Invalid North American area code');
    }
  }

  private validateUKPhone(): void {
    if (
      this.nationalNumber.length !== 10 &&
      this.nationalNumber.length !== 11
    ) {
      throw new Error('UK phone must have 10 or 11 digits');
    }
  }

  private validateFrenchPhone(): void {
    if (this.nationalNumber.length !== 9) {
      throw new Error('French phone must have 9 digits');
    }
  }

  private validateGermanPhone(): void {
    if (this.nationalNumber.length < 10 || this.nationalNumber.length > 12) {
      throw new Error('German phone must have between 10 and 12 digits');
    }
  }

  private validateJapanesePhone(): void {
    if (
      this.nationalNumber.length !== 10 &&
      this.nationalNumber.length !== 11
    ) {
      throw new Error('Japanese phone must have 10 or 11 digits');
    }
  }

  private validateChinesePhone(): void {
    if (this.nationalNumber.length !== 11) {
      throw new Error('Chinese mobile must have 11 digits');
    }

    if (!this.nationalNumber.startsWith('1')) {
      throw new Error('Chinese mobile must start with 1');
    }
  }

  private validateIndianPhone(): void {
    if (this.nationalNumber.length !== 10) {
      throw new Error('Indian phone must have 10 digits');
    }

    const firstDigit = this.nationalNumber.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      throw new Error('Indian mobile must start with 6, 7, 8, or 9');
    }
  }

  getCountryCode(): CountryCode {
    return this.countryCode;
  }

  getNationalNumber(): string {
    return this.nationalNumber;
  }

  getE164Format(): string {
    const prefix = SUPPORTED_COUNTRIES[this.countryCode].phonePrefix;
    return `${prefix}${this.nationalNumber}`;
  }

  getFormattedValue(): string {
    switch (this.countryCode) {
      case 'BR':
        return this.formatBrazilianPhone();
      case 'US':
      case 'CA':
        return this.formatNorthAmericanPhone();
      case 'GB':
        return this.formatUKPhone();
      case 'FR':
        return this.formatFrenchPhone();
      default:
        return this.getE164Format();
    }
  }

  private formatBrazilianPhone(): string {
    const prefix = SUPPORTED_COUNTRIES.BR.phonePrefix;
    if (this.nationalNumber.length === 10) {
      return `${prefix} (${this.nationalNumber.substring(0, 2)}) ${this.nationalNumber.substring(2, 6)}-${this.nationalNumber.substring(6)}`;
    }
    return `${prefix} (${this.nationalNumber.substring(0, 2)}) ${this.nationalNumber.substring(2, 7)}-${this.nationalNumber.substring(7)}`;
  }

  private formatNorthAmericanPhone(): string {
    const prefix = SUPPORTED_COUNTRIES[this.countryCode].phonePrefix;
    return `${prefix} (${this.nationalNumber.substring(0, 3)}) ${this.nationalNumber.substring(3, 6)}-${this.nationalNumber.substring(6)}`;
  }

  private formatUKPhone(): string {
    const prefix = SUPPORTED_COUNTRIES.GB.phonePrefix;
    if (this.nationalNumber.length === 10) {
      return `${prefix} ${this.nationalNumber.substring(0, 4)} ${this.nationalNumber.substring(4, 7)} ${this.nationalNumber.substring(7)}`;
    }
    return `${prefix} ${this.nationalNumber.substring(0, 5)} ${this.nationalNumber.substring(5, 8)} ${this.nationalNumber.substring(8)}`;
  }

  private formatFrenchPhone(): string {
    const prefix = SUPPORTED_COUNTRIES.FR.phonePrefix;
    return `${prefix} ${this.nationalNumber.charAt(0)} ${this.nationalNumber.substring(1, 3)} ${this.nationalNumber.substring(3, 5)} ${this.nationalNumber.substring(5, 7)} ${this.nationalNumber.substring(7)}`;
  }

  toString(): string {
    return this.getFormattedValue();
  }

  equals(other: InternationalPhone): boolean {
    return (
      this.countryCode === other.countryCode &&
      this.nationalNumber === other.nationalNumber
    );
  }

  isMobile(): boolean {
    switch (this.countryCode) {
      case 'BR':
        return this.nationalNumber.length === 11;
      case 'US':
      case 'CA':
        return true;
      case 'GB':
        return this.nationalNumber.startsWith('7');
      case 'FR':
        return (
          this.nationalNumber.startsWith('6') ||
          this.nationalNumber.startsWith('7')
        );
      case 'CN':
      case 'IN':
        return true;
      default:
        return true;
    }
  }
}
