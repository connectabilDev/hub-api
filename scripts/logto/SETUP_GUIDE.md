# 📋 LogTO Setup Guide

## Prerequisites

Antes de executar o script de setup, você precisa:

### 1. Criar uma aplicação M2M no LogTO

1. Acesse seu painel LogTO
2. Vá para **Applications** → **Create Application**
3. Selecione **Machine-to-Machine**
4. Dê um nome como "Hub API Admin"
5. Após criar, copie:
   - **App ID** → `LOGTO_M2M_APP_ID`
   - **App Secret** → `LOGTO_M2M_APP_SECRET`

### 2. Criar o Management API Resource

1. Vá para **API Resources** → **Create API Resource**
2. Configure:
   - **Name**: Logto Management API
   - **Identifier**: `https://[tenant-id].logto.app/api`
   - Substitua `[tenant-id]` pelo seu tenant ID real
3. Adicione o scope `all` para acesso completo

### 3. Atribuir permissões ao M2M App

1. Vá para a aplicação M2M criada
2. Na aba **API Resources**
3. Adicione o Management API Resource
4. Selecione o scope `all`

### 4. Configure o arquivo .env

```env
# LogTO Management API Configuration (M2M)
LOGTO_ENDPOINT=https://[tenant-id].logto.app     # Sua URL do LogTO
LOGTO_TENANT_ID=[tenant-id]                      # Seu tenant ID
LOGTO_M2M_APP_ID=[app-id-from-step-1]           # ID da aplicação M2M
LOGTO_M2M_APP_SECRET=[app-secret-from-step-1]   # Secret da aplicação M2M
BACKEND_URL=http://localhost:3000                # URL do seu backend
```

## Executar o Setup

Após configurar tudo acima:

```bash
# 1. Instalar dependências
yarn install

# 2. Executar setup
yarn logto:setup

# 3. Validar configuração
yarn logto:validate

# 4. Testar webhook (opcional)
yarn logto:test-webhook
```

## O que o script faz

1. **Cria API Resources**
   - Hub API com scopes de read, write, delete, admin
   - Scopes específicos para users e organizations

2. **Configura Webhooks**
   - User.Created - quando um usuário é criado
   - User.Data.Updated - quando dados do usuário são atualizados
   - User.Deleted - quando um usuário é deletado

3. **Cria Roles**
   - Admin - acesso total
   - Manager - gestão com limitações
   - Member - acesso padrão
   - Viewer - apenas leitura

4. **Cria Organization padrão**
   - Default Organization para novos usuários

## Troubleshooting

### Erro: "Invalid resource indicator"

Isso significa que o Management API Resource não está configurado corretamente. Verifique:

1. O resource `https://[tenant-id].logto.app/api` existe
2. A aplicação M2M tem permissão para acessá-lo
3. O tenant ID está correto no .env

### Erro: "401 Unauthorized"

Verifique:

1. App ID e App Secret estão corretos
2. A aplicação M2M está ativa
3. As permissões foram atribuídas corretamente

### Erro: "Missing environment variables"

Certifique-se que o arquivo `.env` existe na raiz do projeto e contém todas as variáveis necessárias.

## Webhook Signature

Após o setup, o script exibirá a signing key do webhook. **SALVE ESTA CHAVE!**

Adicione no seu `.env`:

```env
LOGTO_WEBHOOK_SIGNING_KEY=[chave-gerada]
```

Esta chave é necessária para validar as assinaturas dos webhooks recebidos.

## Próximos Passos

1. Teste o endpoint de webhook: `POST /api/webhooks/logto/user-created`
2. Configure o LogTO para usar seu backend como webhook URL
3. Teste criando um usuário no LogTO e verificando se o webhook é chamado
4. Implemente lógica adicional de sincronização conforme necessário
