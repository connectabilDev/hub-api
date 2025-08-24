#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { LogtoApiClient } from './services/logto-api-client';
import { EnvironmentLoader } from './config/environment-loader';
import { ConsoleLogger } from './utils/console-logger';
import { ConfigValidator } from './utils/config-validator';
import { ExitCodes } from './types/exit-codes';

async function main(): Promise<void> {
  const logger = new ConsoleLogger();

  try {
    logger.info('Starting LogTO configuration validation...');

    const envLoader = new EnvironmentLoader();
    const config = envLoader.load();
    envLoader.validate(config);

    const apiClient = new LogtoApiClient(config, logger);
    const validator = new ConfigValidator(apiClient, logger, config);

    const isValid = await validator.validateConfiguration();

    if (isValid) {
      logger.success('LogTO configuration is valid!');
      process.exit(ExitCodes.SUCCESS);
    } else {
      logger.error('LogTO configuration validation failed');
      process.exit(ExitCodes.VALIDATION_ERROR);
    }
  } catch (error) {
    logger.error('Configuration validation failed:', error);
    process.exit(ExitCodes.ERROR);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(ExitCodes.FATAL);
  });
}
