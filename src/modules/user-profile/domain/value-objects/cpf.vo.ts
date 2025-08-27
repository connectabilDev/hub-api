export class CPF {
  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('CPF must be a string');
    }

    const cleanCpf = this.value.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }

    if (this.isInvalidSequence(cleanCpf)) {
      throw new Error('Invalid CPF sequence');
    }

    if (!this.isValidCpf(cleanCpf)) {
      throw new Error('Invalid CPF');
    }
  }

  private isInvalidSequence(cpf: string): boolean {
    const invalidSequences = [
      '00000000000',
      '11111111111',
      '22222222222',
      '33333333333',
      '44444444444',
      '55555555555',
      '66666666666',
      '77777777777',
      '88888888888',
      '99999999999',
    ];
    return invalidSequences.includes(cpf);
  }

  private isValidCpf(cpf: string): boolean {
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== parseInt(cpf.substring(9, 10))) {
      return false;
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    return remainder === parseInt(cpf.substring(10, 11));
  }

  getValue(): string {
    return this.value;
  }

  getCleanValue(): string {
    return this.value.replace(/\D/g, '');
  }

  getFormattedValue(): string {
    const clean = this.getCleanValue();
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
  }

  toString(): string {
    return this.getFormattedValue();
  }

  equals(other: CPF): boolean {
    return this.getCleanValue() === other.getCleanValue();
  }
}
