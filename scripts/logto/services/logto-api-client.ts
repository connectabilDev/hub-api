import {
  LogtoEnvironmentConfig,
  ApiResource,
  WebhookConfig,
  Role,
  Organization,
  CreateResourceRequest,
  CreateWebhookRequest,
  CreateRoleRequest,
  CreateOrganizationRequest,
} from '../types/logto-config';
import { M2MAuthClient } from './m2m-auth-client';
import { ConsoleLogger } from '../utils/console-logger';

export class LogtoApiClient {
  private readonly authClient: M2MAuthClient;
  private readonly baseUrl: string;

  constructor(
    private readonly config: LogtoEnvironmentConfig,
    private readonly logger: ConsoleLogger,
  ) {
    this.authClient = new M2MAuthClient(config);
    this.baseUrl = `${config.endpoint}/api`;
  }

  async getApiResources(): Promise<ApiResource[]> {
    return this.request<ApiResource[]>('GET', '/resources');
  }

  async createApiResource(
    resource: Omit<CreateResourceRequest, 'scopes'>,
  ): Promise<ApiResource> {
    return this.request<ApiResource>('POST', '/resources', resource);
  }

  async createResourceScope(
    resourceId: string,
    scope: { name: string; description: string },
  ): Promise<void> {
    await this.request('POST', `/resources/${resourceId}/scopes`, scope);
  }

  async getWebhooks(): Promise<WebhookConfig[]> {
    return this.request<WebhookConfig[]>('GET', '/hooks');
  }

  async createWebhook(webhook: CreateWebhookRequest): Promise<WebhookConfig> {
    return this.request<WebhookConfig>('POST', '/hooks', webhook);
  }

  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('GET', '/roles');
  }

  async createRole(role: CreateRoleRequest): Promise<Role> {
    return this.request<Role>('POST', '/roles', role);
  }

  async assignRoleScopes(roleId: string, scopeIds: string[]): Promise<void> {
    await this.request('POST', `/roles/${roleId}/scopes`, { scopeIds });
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('GET', '/organizations');
  }

  async createOrganization(
    org: CreateOrganizationRequest,
  ): Promise<Organization> {
    return this.request<Organization>('POST', '/organizations', org);
  }

  async getApplications(): Promise<any[]> {
    return this.request<any[]>('GET', '/applications');
  }

  async createApplication(application: any): Promise<any> {
    return this.request<any>('POST', '/applications', application);
  }

  async updateApplication(
    applicationId: string,
    updateData: any,
  ): Promise<any> {
    return this.request<any>(
      'PATCH',
      `/applications/${applicationId}`,
      updateData,
    );
  }

  async assignApplicationResourceScope(
    applicationId: string,
    resourceId: string,
    scopeId: string,
  ): Promise<void> {
    await this.request(
      'PUT',
      `/applications/${applicationId}/resources/${resourceId}/scopes/${scopeId}`,
    );
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    const token = await this.authClient.getAccessToken();

    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    this.logger.debug(`${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += ` - ${errorData.message || errorData.error || responseText}`;
        } catch {
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      if (!responseText) {
        return {} as T;
      }

      try {
        return JSON.parse(responseText) as T;
      } catch {
        return responseText as unknown as T;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API request failed: ${String(error)}`);
    }
  }
}
