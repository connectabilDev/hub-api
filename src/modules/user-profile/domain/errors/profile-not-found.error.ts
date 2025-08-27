export class ProfileNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User profile not found: ${identifier}`);
    this.name = 'ProfileNotFoundError';
  }
}
