# Connectabil Hub API

API backend for Connectabil Hub - Professional accounting platform with multi-tenant architecture.

## 🚀 Technologies

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Kysely
- **Authentication**: Logto
- **Queue**: BullMQ with Redis
- **Architecture**: Clean Architecture with Domain-Driven Design

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

## 🤝 Contributing

Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Developed by ConnectabilDev team.
