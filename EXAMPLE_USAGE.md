# Products Module Example Usage

This document demonstrates how to use the comprehensive Products module that follows Clean Architecture principles.

## API Endpoints

### Create Product

```bash
POST /products
Content-Type: application/json

{
  "name": "Premium Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "sku": "HP-001",
  "price": 299.99,
  "stockQuantity": 50,
  "isActive": true
}
```

### Get Product by ID

```bash
GET /products/123e4567-e89b-12d3-a456-426614174000
```

### List Products

```bash
GET /products?page=1&limit=10&activeOnly=true
```

### Update Product

```bash
PUT /products/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "Premium Headphones - Updated",
  "price": 279.99,
  "stockQuantity": 75
}
```

## Domain Features Demonstrated

### Value Objects

- **ProductId**: Ensures valid UUIDs
- **Price**: Handles currency with validation and operations
- **SKU**: Validates and formats stock keeping units

### Business Logic in Entity

- Stock management (add/remove with validation)
- Price updates with business rules
- Product activation/deactivation
- Order fulfillment checks
- Low stock detection

### Error Handling

- Domain-specific errors (ProductNotFoundError, InsufficientStockError)
- Validation errors at multiple layers
- Proper HTTP status codes

### Repository Pattern

- Abstract interface in domain layer
- Kysely implementation in infrastructure layer
- Complex queries (price ranges, low stock, etc.)
- Proper pagination support

## Architecture Layers

```
products/
├── domain/                           # Pure business logic
│   ├── entities/product.entity.ts    # Rich domain model
│   ├── value-objects/               # Type-safe values
│   ├── repositories/                # Abstract contracts
│   └── errors/                      # Domain exceptions
├── application/                     # Use cases & orchestration
│   ├── use-cases/                   # Business workflows
│   ├── dtos/                        # Data contracts
│   └── mappers/                     # Layer translations
└── infrastructure/                  # External concerns
    ├── controllers/                 # HTTP/REST layer
    └── repositories/                # Database implementations
```

## Testing Approach

The module includes comprehensive unit tests that demonstrate:

- Mocking dependencies at boundaries
- Testing business logic in isolation
- Validating error conditions
- Ensuring proper behavior flows

Run tests:

```bash
yarn test src/modules/products/
```

## Migration Support

Database schema is managed through migrations:

```bash
yarn migrate:up    # Create tables
yarn migrate:down  # Drop tables
```

## Key Architectural Benefits

1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Single Responsibility**: Each class has one reason to change
3. **Open/Closed**: Easy to extend without modifying existing code
4. **Interface Segregation**: Focused, minimal interfaces
5. **Liskov Substitution**: Implementations are truly substitutable

This module serves as a template for building other business domains in the application.
