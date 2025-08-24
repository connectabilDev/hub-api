# LogTO Integration Setup

This directory contains comprehensive scripts for setting up and configuring LogTO integration with the NestJS API. The implementation follows Clean Architecture principles and provides automated configuration management.

## Overview

The LogTO integration provides:

- **M2M Authentication**: Secure machine-to-machine authentication
- **API Resources**: Backend API resource configuration with proper scopes
- **Webhooks**: User event synchronization via webhooks
- **Roles & Organizations**: User authorization management
- **User Sync**: Automatic user creation/updates from LogTO events

## Directory Structure

```
scripts/logto/
├── setup-logto.ts              # Main setup script
├── validate-config.ts          # Configuration validator
├── README.md                   # This documentation
├── config/                     # Configuration files
│   ├── environment-loader.ts   # Environment variables loader
│   ├── logto-config-manager.ts # Main configuration manager
│   ├── api-resources.ts        # API resources configuration
│   ├── webhooks.ts             # Webhook configurations
│   ├── roles.ts                # Roles and permissions
│   └── organizations.ts        # Default organizations
├── services/                   # Core services
│   ├── m2m-auth-client.ts      # M2M authentication client
│   └── logto-api-client.ts     # LogTO API client wrapper
├── types/                      # TypeScript types
│   ├── logto-config.ts         # Configuration interfaces
│   └── exit-codes.ts           # Exit code constants
└── utils/                      # Utility classes
    ├── console-logger.ts       # Colored console logger
    └── config-validator.ts     # Configuration validator
```

## Prerequisites

1. **LogTO Instance**: A running LogTO instance with admin access
2. **M2M Application**: A Machine-to-Machine application in LogTO with proper permissions
3. **Environment Variables**: Required environment variables configured
4. **Network Access**: Backend must be accessible from LogTO for webhooks

## Environment Variables

Create or update your `.env` file with the following variables:

```bash
# LogTO Configuration
LOGTO_ENDPOINT=https://your-logto-instance.com
LOGTO_TENANT_ID=your-tenant-id
LOGTO_M2M_APP_ID=your-m2m-app-id
LOGTO_M2M_APP_SECRET=your-m2m-app-secret

# Backend Configuration
BACKEND_URL=https://your-backend-domain.com
LOGTO_WEBHOOK_SIGNING_KEY=generated-during-setup

# Optional: Debug logging
DEBUG=true
NODE_ENV=development
```

### Environment Variable Details

| Variable                    | Description                        | Required | Example                     |
| --------------------------- | ---------------------------------- | -------- | --------------------------- |
| `LOGTO_ENDPOINT`            | Your LogTO instance URL            | Yes      | `https://logto.company.com` |
| `LOGTO_TENANT_ID`           | LogTO tenant identifier            | Yes      | `tenant_abc123`             |
| `LOGTO_M2M_APP_ID`          | M2M application ID                 | Yes      | `app_m2m_xyz789`            |
| `LOGTO_M2M_APP_SECRET`      | M2M application secret             | Yes      | `secret_key_here`           |
| `BACKEND_URL`               | Your backend base URL              | Yes      | `https://api.company.com`   |
| `LOGTO_WEBHOOK_SIGNING_KEY` | Webhook signature verification key | No\*     | Auto-generated              |

\*The webhook signing key is automatically generated during setup and should be saved to your environment.

## Quick Start

### 1. Install Dependencies

Make sure you have all required dependencies:

```bash
yarn install
```

### 2. Configure Environment

Create your `.env` file with the required variables (see above).

### 3. Validate Configuration

Test your LogTO connection and validate existing configuration:

```bash
yarn logto:validate
```

### 4. Run Setup

Execute the main setup script to configure all LogTO resources:

```bash
yarn logto:setup
```

The setup script will:

- ✅ Create API resources with proper scopes
- ✅ Configure webhooks for user events
- ✅ Set up roles and permissions
- ✅ Create default organizations
- ✅ Generate webhook signing keys

### 5. Save Webhook Signing Key

After setup, the webhook signing key will be displayed. **Save this key securely** and add it to your environment:

```bash
LOGTO_WEBHOOK_SIGNING_KEY=your-generated-key-here
```

## API Resources

The setup creates the following API resource:

### Hub API (`hub-api`)

**Scopes:**

- `read` - Read access to API resources
- `write` - Write access to API resources
- `delete` - Delete access to API resources
- `admin` - Full administrative access
- `users:read` - Read user information
- `users:write` - Create and update users
- `users:delete` - Delete users
- `organizations:read` - Read organization information
- `organizations:write` - Create and update organizations
- `organizations:admin` - Full organization administration

## Roles and Permissions

The setup creates four default roles with mapped permissions:

### Admin Role

**Scopes:** `admin`, `users:*`, `organizations:*`

- Full system access
- Can manage all users and organizations

### Manager Role

**Scopes:** `read`, `write`, `users:read`, `users:write`, `organizations:*`

- Can read/write general resources
- Can manage organizations
- Can read/write users (cannot delete)

### Member Role

**Scopes:** `read`, `write`, `users:read`, `organizations:read`

- Can read/write general resources
- Read-only access to users and organizations

### Viewer Role

**Scopes:** `read`, `users:read`, `organizations:read`

- Read-only access to all resources

## Webhooks

The setup configures webhooks to sync user data between LogTO and your backend:

### User Registration Webhook

**Endpoint:** `POST /api/webhooks/logto/user-created`

**Events:**

- `User.Created` - New user registration
- `User.Data.Updated` - User profile updates
- `User.Deleted` - User deletion

**Security:**

- HMAC-SHA256 signature verification
- Timestamp validation (5-minute tolerance)
- Request body verification

### Webhook Payload Example

```json
{
  "hookId": "hook_123456",
  "event": "User.Created",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "data": {
    "id": "user_abc123",
    "username": "john_doe",
    "primaryEmail": "john@example.com",
    "name": "John Doe",
    "avatar": "https://avatar.url/john.png",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "givenName": "John",
      "familyName": "Doe",
      "email": "john@example.com",
      "picture": "https://avatar.url/john.png"
    }
  }
}
```

## Backend Integration

The webhook handler is implemented as a NestJS module following Clean Architecture:

### Module Structure

```
src/modules/webhooks/
├── webhooks.module.ts              # NestJS module
├── domain/                         # Domain layer
│   ├── entities/                   # Webhook event entities
│   └── errors/                     # Domain errors
├── application/                    # Application layer
│   ├── dtos/                       # Data transfer objects
│   └── use-cases/                  # Business logic
└── infrastructure/                 # Infrastructure layer
    ├── controllers/                # HTTP controllers
    └── validators/                 # Signature validators
```

### Key Components

1. **LogtoWebhookController**: Handles webhook HTTP requests
2. **ProcessLogtoUserEventUseCase**: Processes user events
3. **WebhookSignatureValidator**: Validates webhook signatures
4. **User Sync**: Creates/updates users in local database

## Script Commands

### Setup Command

```bash
yarn logto:setup
```

- Configures all LogTO resources
- Idempotent (safe to run multiple times)
- Colored console output with progress indicators

### Validation Command

```bash
yarn logto:validate
```

- Tests API connectivity
- Validates existing configuration
- Reports missing resources

## Security Considerations

1. **Environment Variables**: Store secrets securely, never commit to version control
2. **Webhook Signatures**: Always verify webhook signatures to prevent tampering
3. **HTTPS Only**: Use HTTPS for all LogTO and webhook communications
4. **Token Caching**: M2M tokens are cached securely with automatic refresh
5. **Timing Attacks**: Signature comparison uses timing-safe equality
6. **Rate Limiting**: Consider implementing rate limiting on webhook endpoints

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

```
Error: Failed to obtain M2M token: 401 - invalid_client
```

**Solution:** Verify `LOGTO_M2M_APP_ID` and `LOGTO_M2M_APP_SECRET` are correct.

#### 2. Network Connectivity

```
Error: Failed to connect to LogTO API: ECONNREFUSED
```

**Solution:** Check `LOGTO_ENDPOINT` URL and network connectivity.

#### 3. Permission Errors

```
Error: API request failed: 403 - insufficient_scope
```

**Solution:** Ensure M2M application has required scopes in LogTO console.

#### 4. Webhook Signature Failures

```
Error: Invalid webhook signature
```

**Solution:** Verify `LOGTO_WEBHOOK_SIGNING_KEY` matches the generated key.

### Debug Mode

Enable debug logging:

```bash
DEBUG=true NODE_ENV=development yarn logto:setup
```

This will show:

- Detailed API requests and responses
- Full error stack traces
- Configuration validation steps

### Validation Steps

If setup fails, run validation to diagnose issues:

```bash
yarn logto:validate
```

This will check:

- ✅ API connectivity
- ✅ Existing resources
- ✅ Webhook configuration
- ✅ Role assignments

## Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured in production
- [ ] Webhook endpoint accessible from LogTO
- [ ] HTTPS certificates valid
- [ ] Database migrations applied
- [ ] M2M application permissions verified

### Deployment Steps

1. **Deploy Backend**: Deploy your NestJS application with webhook handlers
2. **Configure Environment**: Set production environment variables
3. **Run Setup**: Execute setup script in production environment
4. **Test Webhooks**: Verify webhook delivery using LogTO console
5. **Monitor Logs**: Check application logs for webhook processing

### Health Checks

The webhook endpoint includes built-in health monitoring:

```bash
curl -X POST https://your-api.com/api/webhooks/logto/user-created \
  -H "Content-Type: application/json" \
  -H "logto-signature-sha-256: test" \
  -H "logto-timestamp: $(date +%s)" \
  -d '{"test": true}'
```

Expected response for signature validation:

```json
{
  "statusCode": 401,
  "message": "Invalid webhook signature"
}
```

## Advanced Configuration

### Custom API Scopes

To add custom scopes, edit `config/api-resources.ts`:

```typescript
export const API_RESOURCES: CreateResourceRequest[] = [
  {
    name: 'Hub API',
    identifier: 'hub-api',
    scopes: [
      // ... existing scopes
      {
        name: 'custom:scope',
        description: 'Custom scope description',
      },
    ],
  },
];
```

### Additional Webhooks

Add new webhooks in `config/webhooks.ts`:

```typescript
export const createWebhookConfigs = (
  backendUrl: string,
): CreateWebhookRequest[] => [
  // ... existing webhooks
  {
    name: 'Custom Event Webhook',
    url: `${backendUrl}/api/webhooks/custom`,
    events: ['Custom.Event'],
    signingKey: generateWebhookSigningKey(),
    enabled: true,
  },
];
```

### Role Customization

Modify roles and permissions in `config/roles.ts`:

```typescript
export const ROLE_SCOPE_MAPPINGS = {
  CustomRole: ['read', 'custom:scope'],
};
```

## Support

For issues and questions:

1. Check this README for common solutions
2. Run validation script to diagnose configuration issues
3. Enable debug mode for detailed logging
4. Review LogTO documentation for API specifics

## License

This LogTO integration is part of the Hub API project and follows the same license terms.
