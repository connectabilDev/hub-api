import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MigrationRunner } from './database/migration-runner';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const migrationRunner = new MigrationRunner();
    await migrationRunner.run();

    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('Hub Platform API')
      .setDescription(
        'API for accounting and finance Hub platform with mentoring, education, jobs, and community modules',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from LogTO authentication',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Workspaces', 'Workspace and team management')
      .addTag('Mentoring', 'Mentoring sessions and schedules')
      .addTag('Education', 'Courses and enrollments')
      .addTag('Jobs', 'Job listings and applications')
      .addTag('Community', 'Community posts and discussions')
      .addTag('Webhooks', 'Webhook handlers for external services')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    logger.log(`Application is running on port ${port}`);
    logger.log(
      `Swagger documentation available at http://localhost:${port}/api/docs`,
    );
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();
