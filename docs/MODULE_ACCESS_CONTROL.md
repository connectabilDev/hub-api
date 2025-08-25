# Controle de Acesso aos Módulos do Hub

## Visão Geral

O sistema de controle de acesso do Hub é baseado em **scopes** que determinam quais ações um usuário pode realizar em cada módulo. Cada role (função) tem um conjunto específico de scopes atribuídos.

## Módulos Disponíveis

- **Community** - Comunidade e discussões
- **Jobs** - Vagas de emprego
- **Mentoring** - Mentoria profissional
- **Education** - Cursos e educação
- **Workspace** - Gestão de workspace

## Mapeamento de Roles para Scopes

### 🔴 Admin

**Acesso total a todos os módulos**

```
✅ admin (acesso total)
✅ users:* (gerenciar usuários)
✅ mentoring:admin
✅ jobs:admin
✅ education:admin
✅ community:admin
✅ workspace:admin
```

### 👤 Candidate (Candidato)

**Busca oportunidades de emprego e desenvolvimento**

#### Jobs (Vagas)

- ✅ `jobs:view` - Visualizar vagas
- ✅ `jobs:apply` - Candidatar-se a vagas

#### Mentoring (Mentoria)

- ✅ `mentoring:view` - Visualizar mentores
- ✅ `mentoring:schedule` - Agendar mentorias

#### Education (Educação)

- ✅ `education:view` - Visualizar cursos
- ✅ `education:enroll` - Inscrever-se em cursos

#### Community (Comunidade)

- ✅ `community:view` - Visualizar posts
- ✅ `community:post` - Criar posts
- ✅ `community:manage` - Gerenciar próprios posts

### 🏢 Employer (Empregador)

**Publica vagas e gerencia candidaturas**

#### Jobs (Vagas)

- ✅ `jobs:view` - Visualizar vagas
- ✅ `jobs:create` - Criar vagas
- ✅ `jobs:manage` - Gerenciar próprias vagas
- ✅ `jobs:review` - Avaliar candidaturas

#### Mentoring (Mentoria)

- ✅ `mentoring:view` - Visualizar mentores
- ✅ `mentoring:schedule` - Agendar mentorias

#### Education (Educação)

- ✅ `education:view` - Visualizar cursos
- ✅ `education:enroll` - Inscrever-se em cursos

#### Community (Comunidade)

- ✅ `community:view` - Visualizar posts
- ✅ `community:post` - Criar posts
- ✅ `community:manage` - Gerenciar próprios posts

#### Workspace

- ✅ `workspace:create` - Criar workspace
- ✅ `workspace:manage` - Gerenciar workspace
- ✅ `workspace:invite` - Convidar membros

### 🎯 Mentor

**Oferece mentoria e orientação profissional**

#### Mentoring (Mentoria)

- ✅ `mentoring:view` - Visualizar mentorias
- ✅ `mentoring:create` - Criar sessões de mentoria
- ✅ `mentoring:manage` - Gerenciar próprias sessões
- ✅ `mentoring:review` - Avaliar mentorandos

#### Jobs (Vagas)

- ✅ `jobs:view` - Visualizar vagas

#### Education (Educação)

- ✅ `education:view` - Visualizar cursos
- ✅ `education:enroll` - Inscrever-se em cursos

#### Community (Comunidade)

- ✅ `community:view` - Visualizar posts
- ✅ `community:post` - Criar posts
- ✅ `community:manage` - Gerenciar próprios posts

#### Workspace

- ✅ `workspace:create` - Criar workspace
- ✅ `workspace:manage` - Gerenciar workspace

### 👨‍🏫 Professor

**Cria e ministra cursos educacionais**

#### Education (Educação)

- ✅ `education:view` - Visualizar cursos
- ✅ `education:create` - Criar cursos
- ✅ `education:teach` - Ministrar cursos
- ✅ `education:manage` - Gerenciar próprios cursos
- ✅ `education:grade` - Avaliar alunos

#### Mentoring (Mentoria)

- ✅ `mentoring:view` - Visualizar mentorias
- ✅ `mentoring:create` - Criar sessões
- ✅ `mentoring:manage` - Gerenciar sessões

#### Jobs (Vagas)

- ✅ `jobs:view` - Visualizar vagas

#### Community (Comunidade)

- ✅ `community:view` - Visualizar posts
- ✅ `community:post` - Criar posts
- ✅ `community:manage` - Gerenciar próprios posts

#### Workspace

- ✅ `workspace:create` - Criar workspace
- ✅ `workspace:manage` - Gerenciar workspace

### 👥 User (Usuário Básico)

**Acesso básico ao sistema**

- ✅ `profile:read` - Ler próprio perfil
- ✅ `profile:write` - Atualizar próprio perfil
- ✅ `community:view` - Visualizar comunidade

## Níveis de Permissão por Módulo

### Community (Comunidade)

| Scope                | Descrição                     | Roles que possuem                      |
| -------------------- | ----------------------------- | -------------------------------------- |
| `community:view`     | Visualizar posts e discussões | Todos                                  |
| `community:post`     | Criar posts e comentários     | Candidate, Employer, Mentor, Professor |
| `community:manage`   | Gerenciar próprios posts      | Candidate, Employer, Mentor, Professor |
| `community:moderate` | Moderar conteúdo de outros    | Admin                                  |
| `community:admin`    | Administração total           | Admin                                  |

### Jobs (Vagas)

| Scope         | Descrição                | Roles que possuem |
| ------------- | ------------------------ | ----------------- |
| `jobs:view`   | Visualizar vagas         | Todos exceto User |
| `jobs:apply`  | Candidatar-se            | Candidate         |
| `jobs:create` | Criar vagas              | Employer          |
| `jobs:manage` | Gerenciar próprias vagas | Employer          |
| `jobs:review` | Avaliar candidaturas     | Employer          |
| `jobs:admin`  | Administração total      | Admin             |

### Mentoring (Mentoria)

| Scope                | Descrição                   | Roles que possuem                      |
| -------------------- | --------------------------- | -------------------------------------- |
| `mentoring:view`     | Visualizar mentores/sessões | Candidate, Employer, Mentor, Professor |
| `mentoring:schedule` | Agendar mentorias           | Candidate, Employer                    |
| `mentoring:create`   | Criar sessões de mentoria   | Mentor, Professor                      |
| `mentoring:manage`   | Gerenciar próprias sessões  | Mentor, Professor                      |
| `mentoring:review`   | Avaliar sessões             | Mentor                                 |
| `mentoring:admin`    | Administração total         | Admin                                  |

### Education (Educação)

| Scope              | Descrição                 | Roles que possuem           |
| ------------------ | ------------------------- | --------------------------- |
| `education:view`   | Visualizar cursos         | Todos exceto User           |
| `education:enroll` | Inscrever-se em cursos    | Candidate, Employer, Mentor |
| `education:create` | Criar cursos              | Professor                   |
| `education:teach`  | Ministrar cursos          | Professor                   |
| `education:manage` | Gerenciar próprios cursos | Professor                   |
| `education:grade`  | Avaliar alunos            | Professor                   |
| `education:admin`  | Administração total       | Admin                       |

### Workspace

| Scope                | Descrição               | Roles que possuem           |
| -------------------- | ----------------------- | --------------------------- |
| `workspace:view`     | Visualizar workspace    | Todos com workspace         |
| `workspace:create`   | Criar workspace         | Employer, Mentor, Professor |
| `workspace:manage`   | Gerenciar configurações | Employer, Mentor, Professor |
| `workspace:invite`   | Convidar membros        | Employer                    |
| `workspace:moderate` | Moderar conteúdo        | Admin                       |
| `workspace:admin`    | Administração total     | Admin                       |

## Como Usar no Backend

### Proteger um Controller Inteiro

```typescript
@Controller('community')
@UseGuards(JwtAuthGuard, ModuleAccessGuard)
@RequireModule('community')
export class CommunityController {
  // Todos os endpoints requerem community:view
}
```

### Proteger Endpoints Específicos

```typescript
@Post('posts')
@UseGuards(ModuleActionGuard)
@RequireModuleAction('community', 'post')
async createPost() {
  // Requer community:post
}

@Delete('posts/:id')
@UseGuards(ModuleActionGuard)
@RequireModuleAction('community', 'manage')
async deletePost() {
  // Requer community:manage
}
```

### Usar Scopes Diretamente

```typescript
@Get('admin/stats')
@UseGuards(ScopesGuard)
@Scopes('community:admin')
async getAdminStats() {
  // Requer community:admin
}
```

## Como Usar no Frontend

### Hook useModuleAccess

```typescript
import { useModuleAccess } from '@/hooks/useModuleAccess';

const CommunityPage = () => {
  const {
    hasModuleAccess,
    hasModuleAction,
    getModulePermissions
  } = useModuleAccess();

  // Verificar acesso ao módulo
  if (!hasModuleAccess('community')) {
    return <AccessDenied />;
  }

  // Obter todas as permissões
  const permissions = getModulePermissions('community');

  return (
    <div>
      {permissions.canView && <PostsList />}
      {permissions.canCreate && <CreatePostButton />}
      {permissions.canModerate && <ModerateSection />}
    </div>
  );
};
```

### Navegação Condicional

```typescript
const Navigation = () => {
  const { getUserModules } = useModuleAccess();
  const modules = getUserModules();

  return (
    <nav>
      {modules.map(module => (
        <Link key={module} to={`/${module}`}>
          {module}
        </Link>
      ))}
    </nav>
  );
};
```

## Fluxo de Autorização

1. **Login**: Usuário autentica via LogTO
2. **JWT**: Token inclui scopes baseados na role
3. **Request**: Frontend envia token no header Authorization
4. **Guards**: Backend valida scopes usando guards
5. **Resposta**: Acesso permitido ou negado (403 Forbidden)

## Configuração no LogTO

Os scopes são configurados em:

- `/scripts/logto/config/api-resources.ts` - Define todos os scopes
- `/scripts/logto/config/roles.ts` - Mapeia roles para scopes

Para adicionar novos scopes ou modificar permissões, execute:

```bash
yarn ts-node scripts/logto/setup-logto.ts
```

## Troubleshooting

### Usuário não tem acesso ao módulo?

1. Verifique a role do usuário no LogTO
2. Confirme que a role tem os scopes necessários
3. Verifique se o JWT contém os scopes:
   ```bash
   yarn ts-node scripts/logto/verify-jwt-configuration.ts
   ```
4. Force novo login para atualizar o token

### Scope não está funcionando?

1. Verifique se o scope existe em `api-resources.ts`
2. Confirme que está mapeado na role em `roles.ts`
3. Verifique se o guard está configurado corretamente
4. Teste com o endpoint `/community/access-check`
