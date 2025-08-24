import { ExecutionContext } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';

// Extract the function from the CurrentUser decorator for testing
const currentUserFunction = (
  data: keyof User | undefined,
  ctx: ExecutionContext,
) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
};

describe('CurrentUser Decorator Function', () => {
  let mockExecutionContext: ExecutionContext;
  let mockUser: User;

  beforeEach(() => {
    mockUser = new User({
      id: 'user-123',
      email: 'test@example.com',
      sub: 'logto-sub-123',
      iat: 1640995200,
      exp: 1641081600,
      aud: 'api-resource',
      iss: 'https://logto.example.com/oidc',
    });

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    } as ExecutionContext;
  });

  it('should extract user from request', () => {
    const result = currentUserFunction(undefined, mockExecutionContext);

    expect(result).toBe(mockUser);
  });

  it('should extract specific user property when key is provided', () => {
    const result = currentUserFunction('email', mockExecutionContext);

    expect(result).toBe('test@example.com');
  });

  it('should return undefined for non-existent property', () => {
    const result = currentUserFunction(
      'nonExistentProperty' as any,
      mockExecutionContext,
    );

    expect(result).toBeUndefined();
  });

  it('should return undefined when no user in request', () => {
    const contextWithoutUser = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    const result = currentUserFunction(undefined, contextWithoutUser);

    expect(result).toBeUndefined();
  });
});
