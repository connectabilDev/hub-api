export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF: ${cpf}`);
    this.name = 'InvalidCpfError';
  }
}
