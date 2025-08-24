import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { MigrationRunner } from './database/migration-runner';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const migrationRunner = new MigrationRunner();
    await migrationRunner.run();

    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);

    logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();
