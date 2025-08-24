#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { LogtoConfigManager } from './config/logto-config-manager';
import { EnvironmentLoader } from './config/environment-loader';
import { ConsoleLogger } from './utils/console-logger';
import { ExitCodes } from './types/exit-codes';

async function main(): Promise<void> {
  const logger = new ConsoleLogger();

  try {
    logger.info('Starting LogTO setup...');

    const envLoader = new EnvironmentLoader();
    const config = envLoader.load();

    const configManager = new LogtoConfigManager(config, logger);

    await configManager.setup();

    logger.success('LogTO setup completed successfully!');
    process.exit(ExitCodes.SUCCESS);
  } catch (error) {
    logger.error('LogTO setup failed:', error);
    process.exit(ExitCodes.ERROR);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(ExitCodes.FATAL);
  });
}
