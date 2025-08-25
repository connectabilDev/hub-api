# Configuração JWT com Organizations e Roles

## ✅ Status Atual

A configuração JWT já está **totalmente preparada** para incluir organizations e roles nos tokens.

### Backend (API)

✅ **LogtoTokenValidationService** está configurado para processar:

- `organizations`: Array de IDs das organizações do usuário
- `organization_roles`: Array de strings no formato `org_id:role_id`

✅ **JwtPayload Interface** já inclui todos os campos necessários

### Frontend (React)

✅ **Scopes configurados** no `logto.config.example.ts`:

- `urn:logto:scope:organizations` - Para incluir IDs das organizações
- `urn:logto:scope:organization_roles` - Para incluir roles nas organizações

## 📋 Como Funciona

### 1. Quando o usuário faz login

O frontend solicita os scopes:

```typescript
scopes: [
  'profile',
  'email',
  'urn:logto:scope:organizations',
  'urn:logto:scope:organization_roles',
  // ... outros scopes
];
```

### 2. LogTO retorna o JWT com:

```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "organizations": ["org_abc123", "org_def456"],
  "organization_roles": ["org_abc123:Admin", "org_def456:Member"]
  // ... outros claims
}
```

### 3. Backend valida e extrai:

```typescript
const user = await validateToken(token);
console.log(user.organizations); // ["org_abc123", "org_def456"]
console.log(user.organizationRoles); // ["org_abc123:Admin", "org_def456:Member"]
```

## 🔍 Como Verificar

### 1. Execute o script de verificação:

```bash
yarn ts-node scripts/logto/verify-jwt-configuration.ts
```

### 2. Teste com um token real:

1. Faça login na aplicação
2. No browser, abra o DevTools > Application > Local Storage
3. Procure pelo token
4. Cole em [jwt.io](https://jwt.io) para decodificar
5. Verifique se contém `organizations` e `organization_roles`

## ⚠️ Requisitos

Para que os dados apareçam no JWT:

1. **Usuário deve estar em pelo menos uma organização**
   - Verifique no LogTO Admin Console
   - Organizations > Selecione org > Members

2. **Usuário deve ter roles na organização**
   - Verifique no LogTO Admin Console
   - Organizations > Selecione org > Members > Edit roles

3. **Frontend deve solicitar os scopes corretos**
   - Já configurado em `logto.config.example.ts`

## 🛠️ Troubleshooting

### Organizations/Roles não aparecem no JWT?

1. **Verifique associação do usuário:**

```bash
# No LogTO Admin Console
Organizations > [Sua Org] > Members
```

2. **Verifique se a aplicação está solicitando os scopes:**

```typescript
// No frontend React
const config = {
  scopes: [
    'urn:logto:scope:organizations',
    'urn:logto:scope:organization_roles',
  ],
};
```

3. **Force novo login:**

```typescript
// Limpe o cache e faça novo login
await logto.signOut();
await logto.signIn();
```

## 📚 Referências

- [LogTO Organizations Documentation](https://docs.logto.io/docs/recipes/organizations/)
- [LogTO Custom JWT Claims](https://docs.logto.io/docs/recipes/custom-jwt-claims/)
- Scripts de configuração: `/scripts/logto/`
