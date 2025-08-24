import { config } from 'dotenv';
import { LogtoEnvironmentConfig } from '../types/logto-config';

export class EnvironmentLoader {
  constructor() {
    config();
  }

  load(): LogtoEnvironmentConfig {
    const requiredEnvVars = {
      LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT,
      LOGTO_TENANT_ID: process.env.LOGTO_TENANT_ID,
      LOGTO_M2M_APP_ID: process.env.LOGTO_M2M_APP_ID,
      LOGTO_M2M_APP_SECRET: process.env.LOGTO_M2M_APP_SECRET,
      BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
      LOGTO_API_RESOURCE_INDICATOR:
        process.env.LOGTO_API_RESOURCE_INDICATOR ||
        'https://hub-api.connectabil.com',
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(
        ([key, value]) =>
          !value &&
          key !== 'BACKEND_URL' &&
          key !== 'LOGTO_API_RESOURCE_INDICATOR',
      )
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    return {
      endpoint: requiredEnvVars.LOGTO_ENDPOINT!,
      tenantId: requiredEnvVars.LOGTO_TENANT_ID!,
      m2mAppId: requiredEnvVars.LOGTO_M2M_APP_ID!,
      m2mAppSecret: requiredEnvVars.LOGTO_M2M_APP_SECRET!,
      backendUrl: requiredEnvVars.BACKEND_URL,
      apiResourceIndicator: requiredEnvVars.LOGTO_API_RESOURCE_INDICATOR,
    };
  }

  validate(config: LogtoEnvironmentConfig): void {
    if (!config.endpoint.startsWith('http')) {
      throw new Error('LOGTO_ENDPOINT must be a valid URL');
    }

    if (!config.backendUrl.startsWith('http')) {
      throw new Error('BACKEND_URL must be a valid URL');
    }

    if (!config.tenantId.trim()) {
      throw new Error('LOGTO_TENANT_ID cannot be empty');
    }
  }
}
