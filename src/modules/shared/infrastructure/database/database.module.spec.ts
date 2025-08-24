import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { DatabaseModule, DATABASE_CONNECTION } from './database.module';
import { DatabaseConfigService } from './database.config';
import { Database } from './database.types';

describe('DatabaseModule', () => {
  let module: TestingModule;
  let databaseConnection: Kysely<Database>;
  let databaseConfigService: DatabaseConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule,
      ],
    }).compile();

    databaseConnection = module.get<Kysely<Database>>(DATABASE_CONNECTION);
    databaseConfigService = module.get<DatabaseConfigService>(
      DatabaseConfigService,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Configuration', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide DATABASE_CONNECTION token', () => {
      expect(databaseConnection).toBeDefined();
      expect(databaseConnection).toBeInstanceOf(Kysely);
    });

    it('should provide DatabaseConfigService', () => {
      expect(databaseConfigService).toBeDefined();
      expect(databaseConfigService).toBeInstanceOf(DatabaseConfigService);
    });

    it('should have ConfigService available', () => {
      expect(configService).toBeDefined();
      expect(configService).toBeInstanceOf(ConfigService);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject DATABASE_CONNECTION in repositories', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
        providers: [
          {
            provide: 'TestRepository',
            useFactory: (db: Kysely<Database>) => {
              return { db };
            },
            inject: [DATABASE_CONNECTION],
          },
        ],
      }).compile();

      const testRepository = testModule.get('TestRepository');

      expect(testRepository).toBeDefined();
      expect(testRepository.db).toBeDefined();
      expect(testRepository.db).toBeInstanceOf(Kysely);

      await testModule.close();
    });

    it('should inject DatabaseConfigService correctly', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
        providers: [
          {
            provide: 'TestService',
            useFactory: (configService: DatabaseConfigService) => {
              return { configService };
            },
            inject: [DatabaseConfigService],
          },
        ],
      }).compile();

      const testService = testModule.get('TestService');

      expect(testService).toBeDefined();
      expect(testService.configService).toBeDefined();
      expect(testService.configService).toBeInstanceOf(DatabaseConfigService);

      await testModule.close();
    });
  });

  describe('Configuration Integration', () => {
    it('should use ConfigService in DatabaseConfigService', () => {
      const config = databaseConfigService.config;

      expect(config).toBeDefined();
      expect(config.host).toBeDefined();
      expect(config.port).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.username).toBeDefined();
      expect(config.password).toBeDefined();
    });

    it('should create Kysely instance with configuration', () => {
      const kyselyInstance = databaseConfigService.createKyselyInstance();

      expect(kyselyInstance).toBeDefined();
      expect(kyselyInstance).toBeInstanceOf(Kysely);
    });
  });

  describe('Module Lifecycle', () => {
    it('should handle module initialization', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile();

      await testModule.init();

      const connection = testModule.get<Kysely<Database>>(DATABASE_CONNECTION);
      expect(connection).toBeDefined();

      await testModule.close();
    });

    it('should handle module destruction', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile();

      const connection = testModule.get<Kysely<Database>>(DATABASE_CONNECTION);
      expect(connection).toBeDefined();

      await testModule.close();
      // After close, the module should be properly cleaned up
      expect(testModule).toBeDefined();
    });
  });

  describe('Global Module Behavior', () => {
    it('should be available as global module', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule.forRoot()],
        providers: [
          {
            provide: 'TestConsumer',
            useFactory: (db: Kysely<Database>) => ({ db }),
            inject: [DATABASE_CONNECTION],
          },
        ],
      }).compile();

      const testConsumer = testModule.get('TestConsumer');
      expect(testConsumer).toBeDefined();
      expect(testConsumer.db).toBeInstanceOf(Kysely);

      await testModule.close();
    });

    it('should share single database connection across modules', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
        providers: [
          {
            provide: 'Service1',
            useFactory: (db: Kysely<Database>) => ({ db }),
            inject: [DATABASE_CONNECTION],
          },
          {
            provide: 'Service2',
            useFactory: (db: Kysely<Database>) => ({ db }),
            inject: [DATABASE_CONNECTION],
          },
        ],
      }).compile();

      const service1 = testModule.get('Service1');
      const service2 = testModule.get('Service2');

      expect(service1.db).toBe(service2.db); // Should be same instance

      await testModule.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            ignoreEnvFile: true,
          }),
        ],
        providers: [DatabaseConfigService],
      }).compile();

      const configService = testModule.get<DatabaseConfigService>(
        DatabaseConfigService,
      );

      // Should use defaults when environment variables are missing
      const config = configService.config;
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('hub');

      await testModule.close();
    });

    it('should handle configuration service errors', async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('Config error');
        }),
      };

      const testModule = await Test.createTestingModule({
        providers: [
          DatabaseConfigService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const databaseConfigService = testModule.get<DatabaseConfigService>(
        DatabaseConfigService,
      );

      expect(() => databaseConfigService.config).toThrow('Config error');

      await testModule.close();
    });
  });

  describe('Provider Factory', () => {
    it('should correctly create database connection using factory', async () => {
      const testModule = await Test.createTestingModule({
        providers: [
          DatabaseConfigService,
          {
            provide: ConfigService,
            useValue: {
              get: jest
                .fn()
                .mockImplementation(
                  (key: string, defaultValue: any) => defaultValue,
                ),
            },
          },
          {
            provide: DATABASE_CONNECTION,
            useFactory: (configService: DatabaseConfigService) => {
              return configService.createKyselyInstance();
            },
            inject: [DatabaseConfigService],
          },
        ],
      }).compile();

      const connection = testModule.get<Kysely<Database>>(DATABASE_CONNECTION);

      expect(connection).toBeDefined();
      expect(connection).toBeInstanceOf(Kysely);

      await testModule.close();
    });

    it('should handle factory errors', async () => {
      const mockConfigService = {
        createKyselyInstance: jest.fn().mockImplementation(() => {
          throw new Error('Factory error');
        }),
      };

      // Creating the module should not throw, but compilation should
      await expect(
        Test.createTestingModule({
          providers: [
            {
              provide: DatabaseConfigService,
              useValue: mockConfigService,
            },
            {
              provide: DATABASE_CONNECTION,
              useFactory: (configService: DatabaseConfigService) => {
                return configService.createKyselyInstance();
              },
              inject: [DatabaseConfigService],
            },
          ],
        }).compile(),
      ).rejects.toThrow('Factory error');
    });
  });
});
