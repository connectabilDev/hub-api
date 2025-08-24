import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Kysely } from 'kysely';
import { Database } from './database.types';
import { DatabaseConfigService } from './database.config';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseConfigService,
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: DatabaseConfigService): Kysely<Database> => {
        return configService.createKyselyInstance();
      },
      inject: [DatabaseConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION, DatabaseConfigService],
})
export class DatabaseModule {
  static forRoot() {
    return {
      module: DatabaseModule,
      global: true,
    };
  }
}
