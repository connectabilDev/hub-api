import { CPF } from './cpf.vo';

describe('CPF Value Object', () => {
  describe('Valid CPF', () => {
    it('should create CPF with valid number', () => {
      const cpf = new CPF('12345678909');
      expect(cpf.getCleanValue()).toBe('12345678909');
    });

    it('should create CPF with formatted number', () => {
      const cpf = new CPF('123.456.789-09');
      expect(cpf.getCleanValue()).toBe('12345678909');
      expect(cpf.getFormattedValue()).toBe('123.456.789-09');
    });

    it('should format unformatted CPF', () => {
      const cpf = new CPF('12345678909');
      expect(cpf.getFormattedValue()).toBe('123.456.789-09');
    });
  });

  describe('Invalid CPF', () => {
    it('should throw error for empty CPF', () => {
      expect(() => new CPF('')).toThrow('CPF must be a string');
    });

    it('should throw error for CPF with wrong length', () => {
      expect(() => new CPF('123456789')).toThrow('CPF must have 11 digits');
    });

    it('should throw error for invalid sequence', () => {
      expect(() => new CPF('11111111111')).toThrow('Invalid CPF sequence');
    });

    it('should throw error for invalid check digits', () => {
      expect(() => new CPF('12345678901')).toThrow('Invalid CPF');
    });

    it('should throw error for non-string input', () => {
      expect(() => new CPF(null as any)).toThrow('CPF must be a string');
    });
  });

  describe('Equality', () => {
    it('should return true for equal CPFs', () => {
      const cpf1 = new CPF('123.456.789-09');
      const cpf2 = new CPF('12345678909');
      expect(cpf1.equals(cpf2)).toBe(true);
    });

    it('should return false for different CPFs', () => {
      const cpf1 = new CPF('12345678909');
      const cpf2 = new CPF('98765432100');
      expect(cpf1.equals(cpf2)).toBe(false);
    });
  });

  describe('ToString', () => {
    it('should return formatted CPF', () => {
      const cpf = new CPF('12345678909');
      expect(cpf.toString()).toBe('123.456.789-09');
    });
  });
});
