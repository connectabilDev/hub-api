import { LogtoApiClient } from '../services/logto-api-client';
import { ConsoleLogger } from './console-logger';
import { LogtoEnvironmentConfig } from '../types/logto-config';

export class ConfigValidator {
  constructor(
    private readonly apiClient: LogtoApiClient,
    private readonly logger: ConsoleLogger,
    private readonly config: LogtoEnvironmentConfig,
  ) {}

  async validateConfiguration(): Promise<boolean> {
    this.logger.info('Validating LogTO configuration...');

    try {
      await this.validateConnection();
      await this.validateResources();
      await this.validateWebhooks();
      await this.validateRoles();

      this.logger.success('Configuration validation completed successfully');
      return true;
    } catch (error) {
      this.logger.error('Configuration validation failed:', error);
      return false;
    }
  }

  private async validateConnection(): Promise<void> {
    this.logger.step(1, 4, 'Testing API connection...');

    try {
      await this.apiClient.getApiResources();
      this.logger.success('API connection successful');
    } catch (error) {
      throw new Error(
        `Failed to connect to LogTO API: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async validateResources(): Promise<void> {
    this.logger.step(2, 4, 'Validating API resources...');

    const resources = await this.apiClient.getApiResources();
    const hubApiResource = resources.find(
      (r) => r.indicator === this.config.apiResourceIndicator,
    );

    if (!hubApiResource) {
      this.logger.warn(
        'Hub API resource not found - will be created during setup',
      );
      return;
    }

    this.logger.success(
      `Found Hub API resource with ${hubApiResource.scopes?.length || 0} scopes`,
    );
  }

  private async validateWebhooks(): Promise<void> {
    this.logger.step(3, 4, 'Validating webhooks...');

    const webhooks = await this.apiClient.getWebhooks();
    const userWebhook = webhooks.find(
      (w) => w.name === 'User Registration Webhook',
    );

    if (!userWebhook) {
      this.logger.warn(
        'User Registration Webhook not found - will be created during setup',
      );
      return;
    }

    if (!userWebhook.enabled) {
      this.logger.warn('User Registration Webhook is disabled');
    } else {
      this.logger.success('User Registration Webhook is active');
    }
  }

  private async validateRoles(): Promise<void> {
    this.logger.step(4, 4, 'Validating roles...');

    const roles = await this.apiClient.getRoles();
    const expectedRoles = ['Admin', 'Manager', 'Member', 'Viewer'];

    const missingRoles = expectedRoles.filter(
      (roleName) => !roles.find((r) => r.name === roleName),
    );

    if (missingRoles.length > 0) {
      this.logger.warn(
        `Missing roles: ${missingRoles.join(', ')} - will be created during setup`,
      );
    } else {
      this.logger.success('All expected roles are configured');
    }
  }
}
