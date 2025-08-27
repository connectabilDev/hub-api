# Connectabil Hub API

API backend for Connectabil Hub - Professional accounting platform with multi-tenant architecture.

## 🚀 Technologies

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Kysely
- **Authentication**: Logto
- **Queue**: BullMQ with Redis
- **Architecture**: Clean Architecture with Domain-Driven Design
- **Internationalization**: nestjs-i18n with multi-language support

## 🏗️ Architecture

This project follows Clean Architecture principles with modular organization:

```
src/
├── modules/
│   ├── auth/           # Authentication and authorization
│   ├── community/      # Community features (posts, likes, comments)
│   ├── organization/   # Multi-tenant organization management
│   ├── user-profile/   # User profiles with Brazilian document support
│   ├── users/          # User management
│   ├── webhooks/       # Webhook handlers
│   └── shared/         # Shared infrastructure and utilities
```

## ✨ Features

- **Multi-tenant Architecture**: Schema-based isolation for complete data separation
- **Brazilian Document Support**: CPF, RG, and phone validation
- **Organization Management**: Logto-based organization with role management
- **Community Features**: Posts, likes, comments with real-time notifications
- **User Profiles**: Comprehensive profiles with onboarding workflow
- **Webhook Integration**: Automatic user and organization provisioning
- **Internationalization (i18n)**: Support for multiple languages (en, pt-BR, es)

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis
- Logto instance

### Installation

```bash
# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
yarn migration:run

# Start development server
yarn start:dev
```

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run test coverage
yarn test:cov

# Run e2e tests
yarn test:e2e
```

## 📝 API Documentation

API documentation is available at `/api/docs` when running the development server.

## 🔒 Security

- JWT-based authentication with Logto
- Role-based access control (RBAC)
- Schema-based multi-tenant isolation
- Input validation and sanitization
- Rate limiting and CORS protection

## 📦 Modules

### Auth Module

Handles authentication and authorization using Logto as the identity provider.

### Organization Module

Manages multi-tenant organizations with complete data isolation using PostgreSQL schemas.

### User Profile Module

Comprehensive user profiles with:

- Brazilian document validation (CPF, RG)
- Address management with CEP validation
- Multi-step onboarding workflow
- Professional information tracking

### Community Module

Social features including:

- Posts with media attachments
- Likes and comments
- Real-time notifications via BullMQ
- Feed with caching support

## 🌍 Internationalization (i18n)

The API supports multiple languages for global accessibility:

### Supported Languages

- **English (en)** - Default language
- **Portuguese Brazil (pt-BR)** - Brazilian Portuguese
- **Spanish (es)** - Spanish

### Language Selection

The API determines the language in the following priority order:

1. **Query Parameter**: `?lang=pt-BR` or `?locale=es` or `?l=en`
2. **HTTP Header**: `x-lang: pt-BR` or `x-locale: es`
3. **Accept-Language Header**: Standard browser language preference
4. **Default**: Falls back to English if no preference is specified

### Translation Modules

Translations are organized by feature modules:

- `common` - General messages and UI text
- `auth` - Authentication and authorization messages
- `validation` - Field validation error messages
- `organization` - Organization management messages
- `user-profile` - User profile and onboarding messages

### Testing i18n

Test endpoints are available for validating translations:

- `GET /i18n-test/hello` - Simple hello message
- `GET /i18n-test/welcome` - Welcome message
- `GET /i18n-test/validation-error` - Validation error example
- `GET /i18n-test/auth-error` - Authentication error example
- `GET /i18n-test/all-messages` - All available translations

Example:

```bash
# Request with Portuguese language
curl http://localhost:3000/i18n-test/hello?lang=pt-BR

# Response
{
  "message": "Olá",
  "language": "pt-BR"
}
```

## 🤝 Contributing

Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Developed by ConnectabilDev team.
