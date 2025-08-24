import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Kysely, Migrator } from 'kysely';
import { MigratorService } from './migrator.service';
import { DatabaseConfigService } from '../database.config';
import { MigrationInfo, MigrationDirection } from './migration.interface';

jest.mock('kysely');
jest.mock('pg');

describe('MigratorService', () => {
  let service: MigratorService;
  let databaseConfigService: jest.Mocked<DatabaseConfigService>;
  let mockKysely: jest.Mocked<Kysely<any>>;
  let mockMigrator: jest.Mocked<Migrator>;
  let loggerSpy: jest.SpyInstance;

  const mockConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test-db',
    username: 'test-user',
    password: 'test-password',
    ssl: false,
  };

  const mockMigrations: MigrationInfo[] = [
    {
      name: '001-create-users',
      migration: {
        async up(db: Kysely<any>) {
          await db.schema
            .createTable('users')
            .addColumn('id', 'uuid', (col) => col.primaryKey())
            .execute();
        },
        async down(db: Kysely<any>) {
          await db.schema.dropTable('users').execute();
        },
      },
    },
    {
      name: '002-create-products',
      migration: {
        async up(db: Kysely<any>) {
          await db.schema
            .createTable('products')
            .addColumn('id', 'uuid', (col) => col.primaryKey())
            .execute();
        },
        async down(db: Kysely<any>) {
          await db.schema.dropTable('products').execute();
        },
      },
    },
  ];

  beforeEach(async () => {
    mockKysely = {
      destroy: jest.fn(),
    } as any;

    mockMigrator = {
      migrateToLatest: jest.fn(),
      migrateDown: jest.fn(),
    } as any;

    const mockDatabaseConfigService = {
      config: mockConfig,
      createKyselyInstance: jest.fn(),
    };

    (Kysely as jest.MockedClass<typeof Kysely>).mockImplementation(
      () => mockKysely,
    );
    (Migrator as jest.MockedClass<typeof Migrator>).mockImplementation(
      () => mockMigrator,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DatabaseConfigService,
          useValue: mockDatabaseConfigService,
        },
      ],
    }).compile();

    databaseConfigService = module.get(DatabaseConfigService);
    service = new MigratorService(databaseConfigService, mockMigrations);

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create MigratorService with migrations', () => {
      expect(service).toBeDefined();
      expect(Kysely).toHaveBeenCalled();
      expect(Migrator).toHaveBeenCalled();
    });

    it('should create MigratorService without migrations', () => {
      const serviceWithoutMigrations = new MigratorService(
        databaseConfigService,
      );
      expect(serviceWithoutMigrations).toBeDefined();
    });

    it('should initialize Migrator with correct configuration', () => {
      expect(Migrator).toHaveBeenCalledWith({
        db: mockKysely,
        provider: expect.objectContaining({
          getMigrations: expect.any(Function),
        }),
      });
    });
  });

  describe('migrateToLatest', () => {
    it('should run migrations successfully', async () => {
      const mockResults = [
        {
          status: 'Success' as const,
          migrationName: '001-create-users',
          direction: 'Up' as MigrationDirection,
        },
        {
          status: 'Success' as const,
          migrationName: '002-create-products',
          direction: 'Up' as MigrationDirection,
        },
      ];

      mockMigrator.migrateToLatest.mockResolvedValue({
        error: undefined,
        results: mockResults,
      });

      await service.migrateToLatest();

      expect(mockMigrator.migrateToLatest).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Running migrations...');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Migration "001-create-users" was executed successfully',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Migration "002-create-products" was executed successfully',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Migrations completed successfully',
      );
    });

    it('should handle migration errors', async () => {
      const mockResults = [
        {
          status: 'Success' as const,
          migrationName: '001-create-users',
          direction: 'Up' as MigrationDirection,
        },
        {
          status: 'Error' as const,
          migrationName: '002-create-products',
          direction: 'Up' as MigrationDirection,
        },
      ];

      const error = new Error('Migration failed');
      mockMigrator.migrateToLatest.mockResolvedValue({
        error,
        results: mockResults,
      });

      await expect(service.migrateToLatest()).rejects.toThrow(
        'Migration failed',
      );

      expect(mockMigrator.migrateToLatest).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Migration "001-create-users" was executed successfully',
      );
    });

    it('should handle migration without results', async () => {
      mockMigrator.migrateToLatest.mockResolvedValue({
        error: undefined,
        results: undefined,
      });

      await service.migrateToLatest();

      expect(mockMigrator.migrateToLatest).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Running migrations...');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Migrations completed successfully',
      );
    });

    it('should throw error when migration fails', async () => {
      const error = new Error('Database connection failed');
      mockMigrator.migrateToLatest.mockResolvedValue({
        error,
        results: [],
      });

      await expect(service.migrateToLatest()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('migrateDown', () => {
    it('should run down migration successfully', async () => {
      const mockResults = [
        {
          status: 'Success' as const,
          migrationName: '002-create-products',
          direction: 'Down' as MigrationDirection,
        },
      ];

      mockMigrator.migrateDown.mockResolvedValue({
        error: undefined,
        results: mockResults,
      });

      await service.migrateDown();

      expect(mockMigrator.migrateDown).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Running down migration...');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Down migration "002-create-products" was executed successfully',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Down migration completed successfully',
      );
    });

    it('should handle down migration errors', async () => {
      const mockResults = [
        {
          status: 'Error' as const,
          migrationName: '002-create-products',
          direction: 'Down' as MigrationDirection,
        },
      ];

      const error = new Error('Down migration failed');
      mockMigrator.migrateDown.mockResolvedValue({
        error,
        results: mockResults,
      });

      await expect(service.migrateDown()).rejects.toThrow(
        'Down migration failed',
      );

      expect(mockMigrator.migrateDown).toHaveBeenCalled();
    });

    it('should handle down migration without results', async () => {
      mockMigrator.migrateDown.mockResolvedValue({
        error: undefined,
        results: undefined,
      });

      await service.migrateDown();

      expect(mockMigrator.migrateDown).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Running down migration...');
      expect(loggerSpy).toHaveBeenCalledWith(
        'Down migration completed successfully',
      );
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await service.close();

      expect(mockKysely.destroy).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      const error = new Error('Failed to close connection');
      mockKysely.destroy.mockRejectedValue(error);

      await expect(service.close()).rejects.toThrow(
        'Failed to close connection',
      );
    });
  });

  describe('migration provider', () => {
    it('should return migrations as a record', async () => {
      const migrator = (Migrator as jest.MockedClass<typeof Migrator>).mock
        .calls[0][0];
      const provider = migrator.provider;

      const migrations = await provider.getMigrations();

      expect(migrations).toEqual({
        '001-create-users': mockMigrations[0].migration,
        '002-create-products': mockMigrations[1].migration,
      });
    });

    it('should handle empty migrations', async () => {
      new MigratorService(databaseConfigService, []);

      const migrator = (Migrator as jest.MockedClass<typeof Migrator>).mock
        .calls[1][0];
      const provider = migrator.provider;

      const migrations = await provider.getMigrations();

      expect(migrations).toEqual({});
    });
  });
});
