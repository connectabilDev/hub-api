# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Run

- `yarn build` - Compile TypeScript to JavaScript
- `yarn start` - Start the application
- `yarn start:dev` - Start in development mode with hot reload
- `yarn start:debug` - Start with debugger
- `yarn start:prod` - Start production build

### Testing (TDD Approach)

- `yarn test` - Run unit tests
- `yarn test:watch` - Run tests in watch mode for TDD workflow
- `yarn test:cov` - Generate test coverage report
- `yarn test:debug` - Debug tests
- `yarn test:e2e` - Run end-to-end tests

### Code Quality

- `yarn lint` - Run ESLint and auto-fix issues
- `yarn format` - Format code with Prettier

## Architecture Guidelines

### Clean Architecture Structure - Modular Approach

Este projeto segue os princípios de Clean Architecture com organização modular. Cada módulo é uma feature completa com suas próprias camadas:

```
src/
├── modules/
│   ├── [module-name]/           # Ex: users, products, orders
│   │   ├── domain/              # Camada de domínio do módulo
│   │   │   ├── entities/        # Entidades do domínio
│   │   │   ├── value-objects/   # Objetos de valor
│   │   │   ├── repositories/    # Interfaces de repositório
│   │   │   └── errors/          # Erros específicos do domínio
│   │   ├── application/         # Camada de aplicação do módulo
│   │   │   ├── use-cases/       # Casos de uso
│   │   │   ├── dtos/            # Data Transfer Objects
│   │   │   └── mappers/         # Mapeadores entre camadas
│   │   ├── infrastructure/      # Camada de infraestrutura do módulo
│   │   │   ├── controllers/     # Controllers HTTP
│   │   │   ├── repositories/    # Implementações de repositório
│   │   │   ├── schemas/         # Schemas de banco de dados
│   │   │   └── providers/       # Providers e services externos
│   │   └── [module-name].module.ts  # Módulo NestJS
│   └── shared/                  # Código compartilhado entre módulos
│       ├── domain/              # Domínio compartilhado
│       ├── application/         # Aplicação compartilhada
│       └── infrastructure/      # Infraestrutura compartilhada
├── app.module.ts                # Módulo raiz
└── main.ts                      # Entry point
```

### Exemplo de Estrutura de Módulo

```
src/modules/users/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── value-objects/
│   │   ├── email.vo.ts
│   │   └── user-id.vo.ts
│   ├── repositories/
│   │   └── user.repository.interface.ts
│   └── errors/
│       └── user-not-found.error.ts
├── application/
│   ├── use-cases/
│   │   ├── create-user/
│   │   │   ├── create-user.use-case.ts
│   │   │   ├── create-user.use-case.spec.ts
│   │   │   └── create-user.dto.ts
│   │   └── find-user/
│   │       ├── find-user.use-case.ts
│   │       ├── find-user.use-case.spec.ts
│   │       └── find-user.dto.ts
│   └── mappers/
│       └── user.mapper.ts
├── infrastructure/
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   └── user.controller.spec.ts
│   ├── repositories/
│   │   └── user.repository.impl.ts
│   └── schemas/
│       └── user.schema.ts
└── users.module.ts
```

### SOLID Principles

1. **Single Responsibility**: Cada classe/módulo tem uma única responsabilidade
2. **Open/Closed**: Classes abertas para extensão, fechadas para modificação
3. **Liskov Substitution**: Subtipos devem ser substituíveis por seus tipos base
4. **Interface Segregation**: Interfaces específicas ao invés de uma interface geral
5. **Dependency Inversion**: Dependa de abstrações, não de implementações concretas

### NestJS Integration with Clean Architecture

- **Controllers** ficam em `modules/[module-name]/infrastructure/controllers/`
- **Use Cases** são injetados nos controllers via DI
- **Repositories** interfaces em `modules/[module-name]/domain/repositories/`, implementações em `modules/[module-name]/infrastructure/repositories/`
- **Modules** cada feature é um módulo NestJS independente (`[module-name].module.ts`)
- **Imports** módulos são importados no `app.module.ts` principal

### Test-Driven Development (TDD)

1. **Red**: Escreva o teste primeiro (deve falhar)
2. **Green**: Implemente o mínimo para o teste passar
3. **Refactor**: Melhore o código mantendo os testes passando

Estrutura de testes:

- Unit tests: `*.spec.ts` ao lado do arquivo testado
- Integration tests: `test/integration/`
- E2E tests: `test/e2e/`

### Dependency Injection

Use o sistema de DI do NestJS com abordagem modular:

- Defina interfaces em `modules/[module-name]/domain/repositories/`
- Use `@Injectable()` nas implementações em `modules/[module-name]/infrastructure/`
- Use tokens de injeção para abstrações (ex: `USER_REPOSITORY`)
- Registre providers no módulo específico (`[module-name].module.ts`)

### Error Handling

- Erros de domínio em `modules/[module-name]/domain/errors/`
- Erros de aplicação em `modules/[module-name]/application/errors/`
- Exception filters globais em `modules/shared/infrastructure/filters/`
- Cada módulo pode ter seus próprios filtros específicos

### Database

- Entidades de domínio são diferentes de modelos de banco
- Use mappers para converter entre camadas
- Repositórios retornam entidades de domínio, não modelos de banco

## Development Workflow

1. Comece com testes (TDD) - crie o teste antes da implementação
2. Use agentes especializados para tarefas complexas
3. Mantenha separação clara entre camadas dentro de cada módulo
4. Não adicione comentários no código
5. Siga convenções de nomenclatura TypeScript/NestJS
6. Cada nova feature deve ser um módulo independente
7. Módulos devem ser autocontidos e com baixo acoplamento

## Important Notes

- Sempre use sub-agentes especializados para agilizar o desenvolvimento
- Siga rigorosamente Clean Architecture com estrutura modular
- Cada módulo deve ser independente e seguir os princípios SOLID
- Implemente features usando TDD - teste primeiro, código depois
- Busque informações atualizadas quando necessário no MCP context7
- Não adicione referências a IA/Claude em commits ou código
- Organize código em módulos por contexto de negócio (bounded contexts)
