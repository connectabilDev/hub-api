export class InvalidBirthDateError extends Error {
  constructor(birthDate: Date) {
    super(`Invalid birth date: ${birthDate.toISOString()}`);
    this.name = 'InvalidBirthDateError';
  }
}
