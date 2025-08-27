export class ProfileIncompleteError extends Error {
  constructor(missingFields: string[]) {
    super(`Profile is incomplete. Missing fields: ${missingFields.join(', ')}`);
    this.name = 'ProfileIncompleteError';
  }
}
