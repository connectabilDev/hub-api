import { LogtoEnvironmentConfig } from '../types/logto-config';
import { LogtoApiClient } from '../services/logto-api-client';
import { ConsoleLogger } from '../utils/console-logger';
import { createApiResourceConfigs } from './api-resources';
import { createWebhookConfigs } from './webhooks';
import { ROLES, ROLE_SCOPE_MAPPINGS } from './roles';
import { DEFAULT_ORGANIZATIONS } from './organizations';
import * as fs from 'fs';
import * as path from 'path';

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
    await this.setupSpaApplication();

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

  private async setupSpaApplication(): Promise<void> {
    this.logger.info('Setting up SPA application...');

    try {
      const existingApplications = await this.apiClient.getApplications();
      const existingApp = existingApplications.find(
        (app) => app.name === 'Hub Web',
      );

      let application;
      if (existingApp) {
        this.logger.info('Hub Web application already exists, updating...');
        application = await this.updateSpaApplication(existingApp.id);
      } else {
        application = await this.createSpaApplication();
      }

      const apiResources = await this.apiClient.getApiResources();
      const hubApiResource = apiResources.find(
        (r) => r.indicator === this.config.apiResourceIndicator,
      );

      if (hubApiResource && hubApiResource.scopes && hubApiResource.id) {
        await this.assignApplicationToResource(
          application.id,
          hubApiResource.id,
          hubApiResource.scopes,
        );
      }

      this.generateEnvFiles(application);
    } catch (error) {
      this.logger.error('Failed to setup SPA application:', error);
      throw error;
    }
  }

  private async createSpaApplication(): Promise<any> {
    const applicationData = {
      name: 'Hub Web',
      description: 'Hub Platform Web Application - React SPA',
      type: 'SPA',
      oidcClientMetadata: {
        redirectUris: [
          'http://localhost/callback',
          'http://localhost:3000/callback',
          'http://localhost:3001/callback',
          'http://localhost:5173/callback',
          'http://localhost:4200/callback',
          'https://hub.connectabil.com/callback',
        ],
        postLogoutRedirectUris: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
      },
      customClientMetadata: {
        corsAllowedOrigins: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
        idTokenTtl: 3600,
        refreshTokenTtl: 1209600,
      },
    };

    const application = await this.apiClient.createApplication(applicationData);
    this.logger.success('Created SPA application: Hub Web');
    return application;
  }

  private async updateSpaApplication(applicationId: string): Promise<any> {
    const updateData = {
      oidcClientMetadata: {
        redirectUris: [
          'http://localhost/callback',
          'http://localhost:3000/callback',
          'http://localhost:3001/callback',
          'http://localhost:5173/callback',
          'http://localhost:4200/callback',
          'https://hub.connectabil.com/callback',
        ],
        postLogoutRedirectUris: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
      },
      customClientMetadata: {
        corsAllowedOrigins: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
        idTokenTtl: 3600,
        refreshTokenTtl: 1209600,
      },
    };

    const application = await this.apiClient.updateApplication(
      applicationId,
      updateData,
    );
    this.logger.success('Updated SPA application: Hub Web');
    return application;
  }

  private async assignApplicationToResource(
    applicationId: string,
    resourceId: string,
    scopes: any[],
  ): Promise<void> {
    this.logger.info('Assigning application to API resource...');

    for (const scope of scopes) {
      try {
        await this.apiClient.assignApplicationResourceScope(
          applicationId,
          resourceId,
          scope.id,
        );
        this.logger.info(`  Assigned scope: ${scope.name}`);
      } catch (_error) {
        this.logger.warn(
          `  Scope ${scope.name} may already be assigned or unavailable`,
        );
      }
    }
  }

  private generateEnvFiles(application: any): void {
    const envContent = `# LogTO Configuration for Hub Web (React SPA)
# Generated by LogTO setup script

# LogTO Endpoint
VITE_LOGTO_ENDPOINT=${this.config.endpoint}
REACT_APP_LOGTO_ENDPOINT=${this.config.endpoint}

# Application ID (public - safe to expose in frontend)
VITE_LOGTO_APP_ID=${application.id}
REACT_APP_LOGTO_APP_ID=${application.id}

# API Resource Indicator
VITE_LOGTO_API_RESOURCE=${this.config.apiResourceIndicator}
REACT_APP_LOGTO_API_RESOURCE=${this.config.apiResourceIndicator}

# Redirect URIs (configured in LogTO)
VITE_LOGTO_REDIRECT_URI=http://localhost/callback
REACT_APP_LOGTO_REDIRECT_URI=http://localhost/callback

# Post Logout Redirect URI
VITE_LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost
REACT_APP_LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost
`;

    const envPath = path.join(process.cwd(), '.env.web');
    fs.writeFileSync(envPath, envContent);
    this.logger.info(`Environment variables saved to: ${envPath}`);

    const reactConfigContent = `// LogTO Configuration for React
// Save this file as src/config/logto.ts in your React application

import { LogtoConfig } from '@logto/react';

const config: LogtoConfig = {
  endpoint: process.env.VITE_LOGTO_ENDPOINT || process.env.REACT_APP_LOGTO_ENDPOINT || '',
  appId: process.env.VITE_LOGTO_APP_ID || process.env.REACT_APP_LOGTO_APP_ID || '',
  scopes: [
    // User information scopes
    'profile',
    'email',
    'phone',
    'custom_data',
    'identities',
    'urn:logto:scope:organizations',
    'urn:logto:scope:organization_roles',
    
    // Application-specific scopes
    'vagas:view',
    'vagas:apply',
    'vagas:manage',
    'mentoria:view',
    'mentoria:schedule',
    'mentoria:create',
    'educacao:view',
    'educacao:enroll',
    'educacao:teach',
    'comunidade:view',
    'comunidade:post',
    'comunidade:moderate',
  ],
  resources: [
    process.env.VITE_LOGTO_API_RESOURCE || process.env.REACT_APP_LOGTO_API_RESOURCE || 'http://localhost:3000/api',
  ],
};

export default config;
`;

    const configPath = path.join(process.cwd(), 'logto.config.example.ts');
    fs.writeFileSync(configPath, reactConfigContent);
    this.logger.info(`React configuration example saved to: ${configPath}`);
  }
}
