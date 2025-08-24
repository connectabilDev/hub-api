import { LogtoEnvironmentConfig } from '../types/logto-config';
import { LogtoApiClient } from '../services/logto-api-client';
import { ConsoleLogger } from '../utils/console-logger';
import { createApiResourceConfigs } from './api-resources';
import { createWebhookConfigs } from './webhooks';
import { ROLES, ROLE_SCOPE_MAPPINGS } from './roles';
import { DEFAULT_ORGANIZATIONS } from './organizations';

export class LogtoConfigManager {
  private readonly apiClient: LogtoApiClient;

  constructor(
    private readonly config: LogtoEnvironmentConfig,
    private readonly logger: ConsoleLogger,
  ) {
    this.apiClient = new LogtoApiClient(config, logger);
  }

  async setup(): Promise<void> {
    this.logger.info('Configuring LogTO resources...');

    await this.setupApiResources();
    await this.setupWebhooks();
    await this.setupRoles();
    await this.setupOrganizations();

    this.logger.success('All LogTO resources configured successfully!');
  }

  private async setupApiResources(): Promise<void> {
    this.logger.info('Setting up API resources...');

    try {
      const existingResources = await this.apiClient.getApiResources();
      const apiResourceConfigs = createApiResourceConfigs(
        this.config.apiResourceIndicator,
      );

      for (const resourceConfig of apiResourceConfigs) {
        const exists = existingResources.find(
          (r) => r.indicator === resourceConfig.indicator,
        );

        if (exists) {
          this.logger.info(
            `API resource '${resourceConfig.name}' already exists`,
          );
          continue;
        }

        const { scopes, ...resourceData } = resourceConfig;
        const resource = await this.apiClient.createApiResource(resourceData);
        this.logger.success(`Created API resource: ${resource.name}`);

        // Create scopes for the resource
        if (scopes && scopes.length > 0 && resource.id) {
          for (const scope of scopes) {
            await this.apiClient.createResourceScope(resource.id, scope);
            this.logger.info(`  Added scope: ${scope.name}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to setup API resources:', error);
      throw error;
    }
  }

  private async setupWebhooks(): Promise<void> {
    this.logger.info('Setting up webhooks...');

    try {
      const existingWebhooks = await this.apiClient.getWebhooks();
      const webhookConfigs = createWebhookConfigs(this.config.backendUrl);

      for (const webhookConfig of webhookConfigs) {
        const exists = existingWebhooks.find(
          (w) => w.name === webhookConfig.name,
        );

        if (exists) {
          this.logger.info(`Webhook '${webhookConfig.name}' already exists`);
          continue;
        }

        const webhook = await this.apiClient.createWebhook(webhookConfig);
        this.logger.success(`Created webhook: ${webhook.name}`);
        if (webhook.signingKey) {
          this.logger.info(`Webhook signing key: ${webhook.signingKey}`);
          this.logger.warn(
            'Please save the signing key securely - it will be needed to verify webhook signatures',
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to setup webhooks:', error);
      throw error;
    }
  }

  private async setupRoles(): Promise<void> {
    this.logger.info('Setting up roles...');

    try {
      const existingRoles = await this.apiClient.getRoles();
      const apiResources = await this.apiClient.getApiResources();

      const hubApiResource = apiResources.find(
        (r) => r.indicator === this.config.apiResourceIndicator,
      );
      if (!hubApiResource) {
        throw new Error(
          'Hub API resource not found - cannot assign role scopes',
        );
      }

      for (const roleConfig of ROLES) {
        const exists = existingRoles.find((r) => r.name === roleConfig.name);

        if (exists) {
          this.logger.info(`Role '${roleConfig.name}' already exists`);
          continue;
        }

        const role = await this.apiClient.createRole(roleConfig);
        this.logger.success(`Created role: ${role.name}`);

        const scopeNames =
          ROLE_SCOPE_MAPPINGS[
            roleConfig.name as keyof typeof ROLE_SCOPE_MAPPINGS
          ];
        if (scopeNames && hubApiResource.scopes) {
          const scopeIds = hubApiResource.scopes
            .filter((scope) => scopeNames.includes(scope.name))
            .map((scope) => scope.name);

          if (scopeIds.length > 0 && role.id) {
            await this.apiClient.assignRoleScopes(role.id, scopeIds);
            this.logger.success(
              `Assigned ${scopeIds.length} scopes to role: ${role.name}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to setup roles:', error);
      throw error;
    }
  }

  private async setupOrganizations(): Promise<void> {
    this.logger.info('Setting up organizations...');

    try {
      const existingOrgs = await this.apiClient.getOrganizations();

      for (const orgConfig of DEFAULT_ORGANIZATIONS) {
        const exists = existingOrgs.find((o) => o.name === orgConfig.name);

        if (exists) {
          this.logger.info(`Organization '${orgConfig.name}' already exists`);
          continue;
        }

        const org = await this.apiClient.createOrganization(orgConfig);
        this.logger.success(`Created organization: ${org.name}`);
      }
    } catch (error) {
      this.logger.error('Failed to setup organizations:', error);
      throw error;
    }
  }
}
