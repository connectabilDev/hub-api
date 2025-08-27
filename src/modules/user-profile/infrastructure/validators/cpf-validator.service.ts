import { Injectable } from '@nestjs/common';

@Injectable()
export class CpfValidatorService {
  validate(cpf: string): boolean {
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return false;
    }

    if (this.isInvalidSequence(cleanCpf)) {
      return false;
    }

    return this.calculateCheckDigits(cleanCpf);
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

  private calculateCheckDigits(cpf: string): boolean {
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

  format(cpf: string): string {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      throw new Error('Invalid CPF length');
    }
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
  }

  clean(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
}
