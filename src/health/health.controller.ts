import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Kysely } from 'kysely';
import { DATABASE_CONNECTION } from '../modules/shared/infrastructure/database/database.module';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    @Inject(DATABASE_CONNECTION) private readonly db: Kysely<any>,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.db.selectFrom('users').select('id').limit(1).execute();
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message:
                error instanceof Error
                  ? error.message
                  : 'Database connection failed',
            },
          };
        }
      },
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
