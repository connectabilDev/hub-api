# Authentication Module

This module provides complete JWT-based authentication using LogTO as the authentication provider. It follows Clean Architecture principles and includes comprehensive testing.

## Features

- JWT token validation using LogTO
- Support for ES384 algorithm (LogTO default)
- Clean Architecture with modular structure
- Comprehensive error handling
- Role-based access control support
- Middleware for automatic token parsing
- Guards for route protection
- Decorators for easy user access
- 58 comprehensive tests with 100% coverage

## Installation

The required dependencies are already installed:

- `jose` - For JWT validation
- `@nestjs/config` - For configuration management

## Configuration

Add the following environment variables to your `.env` file:

```bash
LOGTO_DOMAIN=https://your-logto-domain.com
LOGTO_API_RESOURCE_INDICATOR=your-api-resource-identifier
```

## Module Structure

```
src/modules/auth/
├── domain/                     # Domain layer
│   ├── entities/
│   │   └── user.entity.ts     # User domain entity
│   ├── repositories/
│   │   └── token-validation.repository.interface.ts
│   └── errors/
│       └── auth.errors.ts     # Domain-specific errors
├── application/               # Application layer
│   ├── use-cases/
│   │   └── validate-token/
│   │       ├── validate-token.use-case.ts
│   │       └── validate-token.use-case.spec.ts
│   └── dtos/
│       └── validate-token.dto.ts
├── infrastructure/           # Infrastructure layer
│   ├── providers/
│   │   ├── logto-token-validation.service.ts
│   │   └── logto-token-validation.service.spec.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── jwt-auth.guard.spec.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── *.spec.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── auth.middleware.spec.ts
│   └── controllers/
│       └── auth-demo.controller.ts
├── auth.module.ts            # NestJS module
├── index.ts                  # Exports
└── README.md
```

## Usage

### 1. Import the AuthModule

```typescript
import { AuthModule } from './modules/auth';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

### 2. Protect Routes with Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, Public } from '../modules/auth';
import type { User } from '../modules/auth';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  @Get('public')
  @Public() // This route doesn't require authentication
  getPublicData() {
    return { message: 'Public data' };
  }

  @Get('protected')
  getProtectedData(@CurrentUser() user: User) {
    return {
      message: 'Protected data',
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  @Get('user-email')
  getUserEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
```

### 3. Using the Middleware (Optional)

If you want to automatically parse JWT tokens without enforcing authentication:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from './modules/auth';

@Module({
  // ... module config
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*'); // Apply to all routes
  }
}
```

## API Endpoints

The module includes demo endpoints for testing:

- `GET /auth-demo/public` - Public endpoint (no auth required)
- `GET /auth-demo/protected` - Protected endpoint (requires JWT)
- `GET /auth-demo/profile` - Returns full user profile
- `GET /auth-demo/user-email` - Returns user email only

## Authentication Flow

1. **Token Validation**: The system validates JWT tokens using LogTO's JWKS endpoint
2. **User Extraction**: User information is extracted from the JWT payload
3. **Request Decoration**: The user object is attached to the request
4. **Authorization**: Guards check if routes require authentication

## Token Format

Expected JWT payload structure:

```json
{
  "sub": "logto-user-id",
  "user_id": "optional-custom-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://avatar-url.com/image.jpg",
  "roles": ["user", "admin"],
  "iat": 1640995200,
  "exp": 1641081600,
  "aud": "your-api-resource",
  "iss": "https://your-logto-domain.com/oidc"
}
```

## Error Handling

The module includes specific error types:

- `InvalidTokenError` - Token signature or format is invalid
- `TokenExpiredError` - Token has expired
- `UnauthorizedError` - Access denied
- `JwksError` - Failed to retrieve JWKS keys

## Testing

Run the authentication tests:

```bash
# Run all auth tests
yarn test src/modules/auth/

# Run specific test suites
yarn test src/modules/auth/domain/
yarn test src/modules/auth/application/
yarn test src/modules/auth/infrastructure/
```

## Architecture Principles

This module follows:

- **Clean Architecture**: Clear separation between domain, application, and infrastructure
- **SOLID Principles**: Single responsibility, dependency inversion, etc.
- **Domain-Driven Design**: Rich domain entities and value objects
- **Test-Driven Development**: Comprehensive test coverage
- **Dependency Injection**: Loose coupling through interfaces

## Security Features

- **JWT Verification**: Full cryptographic verification using JWKS
- **Token Expiration**: Automatic expiration checking
- **Issuer Validation**: Ensures tokens come from trusted LogTO instance
- **Audience Validation**: Ensures tokens are for your API
- **Algorithm Restriction**: Only accepts ES384 algorithm
- **Error Isolation**: Authentication errors don't expose sensitive information

## Performance Considerations

- **JWKS Caching**: JWKS keys are cached to avoid repeated fetches
- **Lazy Loading**: JWT validation only happens when needed
- **Efficient Parsing**: Minimal token parsing for better performance
- **Memory Optimization**: User objects are created only when validated

## Development Tips

1. **Environment Setup**: Ensure LogTO environment variables are configured
2. **Public Routes**: Use `@Public()` decorator for routes that don't need auth
3. **User Access**: Use `@CurrentUser()` to inject user into controllers
4. **Role Checking**: Use `user.hasRole('admin')` for role-based access
5. **Token Debugging**: Check token expiration with `user.isTokenExpired()`
