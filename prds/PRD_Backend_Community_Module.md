# PRD - Módulo de Comunidade (Backend)

## 1. Visão Geral

### 1.1 Objetivo

Desenvolver a API backend para o módulo de comunidade do Connectabil, permitindo que profissionais de contabilidade interajam, compartilhem conhecimento e construam uma rede de contatos profissional.

### 1.2 Escopo

Este documento define os requisitos técnicos e funcionais para a implementação do backend do módulo de comunidade, incluindo APIs para feed, grupos, fóruns e mensagens.

### 1.3 Stakeholders

- Desenvolvedores Backend
- Desenvolvedores Frontend
- Product Owner
- DevOps
- QA Team

## 2. Requisitos Funcionais

### 2.1 Feed de Atividades

#### 2.1.1 Postagens

- **POST** `/api/v1/feed/posts`
  - Criar nova postagem
  - Campos: content, media[], tags[], visibility
  - Suporte para texto rico (markdown)
  - Upload de imagens/documentos (max 10MB por arquivo)
- **GET** `/api/v1/feed/posts`
  - Listar postagens do feed
  - Paginação (limit, offset)
  - Filtros: userId, tags, dateRange
  - Ordenação: recent, popular, trending
- **GET** `/api/v1/feed/posts/:id`
  - Obter detalhes de uma postagem
- **PUT** `/api/v1/feed/posts/:id`
  - Editar postagem própria
- **DELETE** `/api/v1/feed/posts/:id`
  - Deletar postagem própria

#### 2.1.2 Interações

- **POST** `/api/v1/feed/posts/:id/like`
  - Curtir/descurtir postagem
- **POST** `/api/v1/feed/posts/:id/comments`
  - Comentar em postagem
- **GET** `/api/v1/feed/posts/:id/comments`
  - Listar comentários
  - Suporte para threads de respostas
- **POST** `/api/v1/feed/posts/:id/share`
  - Compartilhar postagem

### 2.2 Grupos

#### 2.2.1 Gerenciamento de Grupos

- **POST** `/api/v1/groups`
  - Criar novo grupo
  - Campos: name, description, privacy (public/private), category, rules
- **GET** `/api/v1/groups`
  - Listar grupos
  - Filtros: category, privacy, memberCount
  - Busca por nome/descrição
- **GET** `/api/v1/groups/:id`
  - Detalhes do grupo
- **PUT** `/api/v1/groups/:id`
  - Atualizar grupo (admin only)
- **DELETE** `/api/v1/groups/:id`
  - Deletar grupo (owner only)

#### 2.2.2 Membros

- **POST** `/api/v1/groups/:id/join`
  - Solicitar entrada no grupo
- **POST** `/api/v1/groups/:id/leave`
  - Sair do grupo
- **GET** `/api/v1/groups/:id/members`
  - Listar membros
  - Roles: owner, admin, moderator, member
- **PUT** `/api/v1/groups/:id/members/:userId`
  - Atualizar role do membro (admin only)
- **DELETE** `/api/v1/groups/:id/members/:userId`
  - Remover membro (admin only)

#### 2.2.3 Conteúdo do Grupo

- **POST** `/api/v1/groups/:id/posts`
  - Criar postagem no grupo
- **GET** `/api/v1/groups/:id/posts`
  - Listar postagens do grupo
  - Filtros: pinned, announcement

### 2.3 Fóruns

#### 2.3.1 Categorias

- **GET** `/api/v1/forums/categories`
  - Listar categorias de fóruns
  - Exemplos: Fiscal, Contábil, Trabalhista, Societário

#### 2.3.2 Tópicos

- **POST** `/api/v1/forums/topics`
  - Criar novo tópico
  - Campos: title, content, category, tags[]
- **GET** `/api/v1/forums/topics`
  - Listar tópicos
  - Filtros: category, tags, answered, dateRange
  - Ordenação: recent, popular, unanswered
- **GET** `/api/v1/forums/topics/:id`
  - Detalhes do tópico com respostas
- **PUT** `/api/v1/forums/topics/:id`
  - Editar tópico (author only)
- **DELETE** `/api/v1/forums/topics/:id`
  - Deletar tópico (author/mod only)

#### 2.3.3 Respostas

- **POST** `/api/v1/forums/topics/:id/replies`
  - Responder tópico
- **PUT** `/api/v1/forums/replies/:id`
  - Editar resposta
- **DELETE** `/api/v1/forums/replies/:id`
  - Deletar resposta
- **POST** `/api/v1/forums/replies/:id/accept`
  - Marcar como melhor resposta (topic author only)
- **POST** `/api/v1/forums/replies/:id/vote`
  - Votar na resposta (upvote/downvote)

### 2.4 Mensagens Diretas

#### 2.4.1 Conversas

- **GET** `/api/v1/messages/conversations`
  - Listar conversas do usuário
  - Ordenação por última mensagem
- **POST** `/api/v1/messages/conversations`
  - Iniciar nova conversa
  - Suporte para grupo de mensagens
- **GET** `/api/v1/messages/conversations/:id`
  - Obter mensagens da conversa
  - Paginação reversa (mensagens mais recentes primeiro)

#### 2.4.2 Mensagens

- **POST** `/api/v1/messages/conversations/:id/messages`
  - Enviar mensagem
  - Tipos: text, image, document, audio
- **PUT** `/api/v1/messages/:id`
  - Editar mensagem
- **DELETE** `/api/v1/messages/:id`
  - Deletar mensagem
- **POST** `/api/v1/messages/:id/read`
  - Marcar como lida

## 3. Requisitos Não Funcionais

### 3.1 Performance

- Tempo de resposta < 200ms para operações de leitura
- Tempo de resposta < 500ms para operações de escrita
- Suporte para 10.000 requisições/minuto
- Cache Redis para feeds e dados frequentes

### 3.2 Segurança

- Autenticação via JWT (Logto)
- Rate limiting por endpoint
- Validação de entrada (sanitização de HTML/SQL)
- Criptografia de mensagens privadas
- CORS configurado adequadamente

### 3.3 Escalabilidade

- Arquitetura de microserviços
- Filas para processamento assíncrono (notificações, emails)
- CDN para arquivos de mídia
- Database sharding para grandes volumes

### 3.4 Disponibilidade

- 99.9% uptime
- Health checks endpoints
- Graceful shutdown
- Circuit breakers para serviços externos

## 4. Modelos de Dados

### 4.1 Post

```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": "string",
  "media": ["url"],
  "tags": ["string"],
  "visibility": "public|private|connections",
  "likes": 0,
  "comments": 0,
  "shares": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4.2 Group

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "privacy": "public|private",
  "category": "string",
  "rules": ["string"],
  "memberCount": 0,
  "ownerId": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4.3 ForumTopic

```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "authorId": "uuid",
  "views": 0,
  "replies": 0,
  "isAnswered": false,
  "acceptedReplyId": "uuid|null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4.4 Message

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "type": "text|image|document|audio",
  "content": "string",
  "mediaUrl": "string|null",
  "isRead": false,
  "isEdited": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 5. Integrações

### 5.1 Serviços Internos

- **Auth Service**: Validação de tokens JWT
- **User Service**: Informações de perfil
- **Notification Service**: Envio de notificações
- **File Service**: Upload e gerenciamento de arquivos

### 5.2 Serviços Externos

- **Logto**: Autenticação e autorização
- **AWS S3**: Armazenamento de mídia
- **SendGrid**: Notificações por email
- **Pusher/Socket.io**: Real-time para mensagens

## 6. Notificações

### 6.1 Eventos de Notificação

- Nova mensagem recebida
- Menção em postagem/comentário
- Resposta em tópico do fórum
- Solicitação para entrar em grupo
- Nova postagem em grupo seguido
- Resposta aceita no fórum

### 6.2 Canais

- Push notification (mobile/web)
- Email (configurável)
- In-app notification center

## 7. Moderação e Administração

### 7.1 Ferramentas de Moderação

- **GET** `/api/v1/moderation/reports`
  - Listar denúncias
- **POST** `/api/v1/moderation/reports`
  - Criar denúncia
  - Tipos: spam, inappropriate, harassment
- **PUT** `/api/v1/moderation/reports/:id`
  - Resolver denúncia
  - Ações: warn, suspend, ban, dismiss

### 7.2 Filtros Automáticos

- Detecção de spam
- Filtro de palavras proibidas
- Rate limiting por usuário
- Detecção de conteúdo duplicado

## 8. Analytics e Métricas

### 8.1 Métricas de Engajamento

- Posts criados por período
- Taxa de interação (likes, comentários, compartilhamentos)
- Usuários ativos (DAU, MAU)
- Tempo médio de resposta em fóruns
- Taxa de resolução de dúvidas

### 8.2 Endpoints de Analytics

- **GET** `/api/v1/analytics/community/overview`
- **GET** `/api/v1/analytics/community/engagement`
- **GET** `/api/v1/analytics/community/trends`

## 9. Migrations e Seeding

### 9.1 Migrations

- Criar tabelas: posts, groups, forum_topics, messages
- Índices para busca e performance
- Triggers para contadores e timestamps

### 9.2 Seed Data

- Categorias de fóruns padrão
- Grupos sugeridos iniciais
- Posts de boas-vindas

## 10. Testes

### 10.1 Testes Unitários

- Cobertura mínima: 80%
- Validações de entrada
- Regras de negócio

### 10.2 Testes de Integração

- Fluxos completos de usuário
- Integração com serviços externos
- Cenários de erro

### 10.3 Testes de Carga

- Simulação de 1000 usuários simultâneos
- Teste de stress para identificar limites
- Monitoramento de performance

## 11. Documentação

### 11.1 API Documentation

- OpenAPI/Swagger specification
- Postman collection
- Exemplos de request/response

### 11.2 Developer Guide

- Setup do ambiente
- Arquitetura da solução
- Guia de contribuição

## 12. Timeline e Fases

### Fase 1 - MVP (4 semanas)

- Feed básico (criar, listar, curtir)
- Grupos (criar, entrar, postar)
- Mensagens diretas básicas

### Fase 2 - Fóruns (3 semanas)

- Sistema completo de fóruns
- Votação e melhor resposta
- Busca avançada

### Fase 3 - Recursos Avançados (3 semanas)

- Notificações real-time
- Moderação e denúncias
- Analytics dashboard

### Fase 4 - Otimização (2 semanas)

- Performance tuning
- Cache optimization
- Load testing

## 13. Riscos e Mitigações

| Risco                                 | Probabilidade | Impacto | Mitigação                                  |
| ------------------------------------- | ------------- | ------- | ------------------------------------------ |
| Escalabilidade com crescimento rápido | Alta          | Alto    | Arquitetura em microserviços, auto-scaling |
| Conteúdo inadequado                   | Média         | Alto    | Moderação automática e manual              |
| Performance em feeds personalizados   | Média         | Médio   | Cache agressivo, algoritmos otimizados     |
| Segurança de dados sensíveis          | Baixa         | Alto    | Criptografia, auditorias regulares         |

## 14. Métricas de Sucesso

- 70% dos usuários ativos mensalmente na comunidade
- Tempo médio de resposta em fóruns < 2 horas
- Taxa de retenção de membros em grupos > 60%
- NPS da funcionalidade > 8
- Zero incidentes de segurança críticos

## 15. Considerações Futuras

- Integração com LinkedIn para importar conexões
- Sistema de reputação e gamificação
- Live streaming para eventos e palestras
- IA para sugestão de conteúdo relevante
- Marketplace de serviços entre profissionais
