export class InvalidTokenError extends Error {
  public readonly name = 'InvalidTokenError';

  constructor(
    message: string = 'Invalid token provided',
    public readonly cause?: Error,
  ) {
    super(message);
  }
}

export class TokenExpiredError extends Error {
  public readonly name = 'TokenExpiredError';

  constructor(message: string = 'Token has expired') {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  public readonly name = 'UnauthorizedError';

  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class JwksError extends Error {
  public readonly name = 'JwksError';

  constructor(
    message: string = 'Failed to retrieve or parse JWKS',
    public readonly cause?: Error,
  ) {
    super(message);
  }
}
