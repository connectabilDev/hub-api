import { Injectable } from '@nestjs/common';

export interface CepValidationResult {
  isValid: boolean;
  address?: {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  error?: string;
}

@Injectable()
export class CepValidatorService {
  validate(cep: string): CepValidationResult {
    if (!cep || typeof cep !== 'string') {
      return {
        isValid: false,
        error: 'CEP must be a string',
      };
    }

    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return {
        isValid: false,
        error: 'CEP must have 8 digits',
      };
    }

    return {
      isValid: true,
      address: {
        cep: this.formatCep(cleanCep),
        street: 'Mock Street',
        neighborhood: 'Mock Neighborhood',
        city: 'Mock City',
        state: 'Mock State',
      },
    };
  }

  private formatCep(cep: string): string {
    return `${cep.substring(0, 5)}-${cep.substring(5)}`;
  }

  clean(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  format(cep: string): string {
    const clean = this.clean(cep);
    if (clean.length !== 8) {
      throw new Error('Invalid CEP length');
    }
    return this.formatCep(clean);
  }
}
