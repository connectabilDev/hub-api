export interface LogtoEnvironmentConfig {
  endpoint: string;
  tenantId: string;
  m2mAppId: string;
  m2mAppSecret: string;
  backendUrl: string;
  apiResourceIndicator: string;
}

export interface ApiResource {
  id?: string;
  name: string;
  indicator: string;
  accessTokenTtl?: number;
  scopes: ResourceScope[];
}

export interface ResourceScope {
  name: string;
  description: string;
}

export interface WebhookConfig {
  id?: string;
  name: string;
  events: string[];
  config: {
    url: string;
    headers?: Record<string, string>;
  };
  signingKey?: string;
  enabled: boolean;
}

export interface Role {
  id?: string;
  name: string;
  description: string;
  scopes?: RoleScope[];
}

export interface RoleScope {
  resourceId: string;
  scopeId: string;
}

export interface Organization {
  id?: string;
  name: string;
  description: string;
}

export interface M2MToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface LogtoApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateResourceRequest {
  name: string;
  indicator: string;
  accessTokenTtl?: number;
  scopes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface CreateWebhookRequest {
  name: string;
  events: string[];
  config: {
    url: string;
    headers?: Record<string, string>;
  };
  enabled: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description: string;
}
