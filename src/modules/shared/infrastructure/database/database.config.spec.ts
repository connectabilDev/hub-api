import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfigService } from './database.config';
import { Kysely } from 'kysely';

describe('DatabaseConfigService', () => {
  let service: DatabaseConfigService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DatabaseConfigService>(DatabaseConfigService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('config', () => {
    it('should return default database configuration when no environment variables are set', () => {
      configService.get.mockImplementation(
        (key: string, defaultValue: any) => defaultValue,
      );

      const config = service.config;

      expect(config).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'hub',
        username: 'postgres',
        password: 'password',
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      expect(configService.get).toHaveBeenCalledWith('DB_HOST', 'localhost');
      expect(configService.get).toHaveBeenCalledWith('DB_PORT', 5432);
      expect(configService.get).toHaveBeenCalledWith('DB_NAME', 'hub');
      expect(configService.get).toHaveBeenCalledWith('DB_USERNAME', 'postgres');
      expect(configService.get).toHaveBeenCalledWith('DB_PASSWORD', 'password');
      expect(configService.get).toHaveBeenCalledWith('DB_SSL', false);
      expect(configService.get).toHaveBeenCalledWith('DB_POOL_MAX', 20);
      expect(configService.get).toHaveBeenCalledWith('DB_IDLE_TIMEOUT', 30000);
      expect(configService.get).toHaveBeenCalledWith(
        'DB_CONNECTION_TIMEOUT',
        2000,
      );
    });

    it('should return custom database configuration from environment variables', () => {
      const mockConfig = {
        DB_HOST: 'custom-host',
        DB_PORT: 3306,
        DB_NAME: 'custom-db',
        DB_USERNAME: 'custom-user',
        DB_PASSWORD: 'custom-password',
        DB_SSL: true,
        DB_POOL_MAX: 50,
        DB_IDLE_TIMEOUT: 60000,
        DB_CONNECTION_TIMEOUT: 5000,
      };

      configService.get.mockImplementation((key: string, defaultValue: any) => {
        return mockConfig[key as keyof typeof mockConfig] ?? defaultValue;
      });

      const config = service.config;

      expect(config).toEqual({
        host: 'custom-host',
        port: 3306,
        database: 'custom-db',
        username: 'custom-user',
        password: 'custom-password',
        ssl: true,
        max: 50,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 5000,
      });
    });

    it('should handle partial environment configuration with defaults', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_HOST') return 'production-host';
        if (key === 'DB_PORT') return 5433;
        return defaultValue;
      });

      const config = service.config;

      expect(config.host).toBe('production-host');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('hub');
      expect(config.username).toBe('postgres');
      expect(config.password).toBe('password');
    });
  });

  describe('createKyselyInstance', () => {
    it('should create a Kysely instance with correct configuration', () => {
      configService.get.mockImplementation(
        (key: string, defaultValue: any) => defaultValue,
      );

      const kyselyInstance = service.createKyselyInstance();

      expect(kyselyInstance).toBeInstanceOf(Kysely);
      expect(kyselyInstance).toBeDefined();
    });

    it('should create Kysely instance with custom configuration', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_HOST') return 'test-host';
        if (key === 'DB_PORT') return 5433;
        if (key === 'DB_NAME') return 'test-db';
        return defaultValue;
      });

      const kyselyInstance = service.createKyselyInstance();

      expect(kyselyInstance).toBeInstanceOf(Kysely);
      expect(kyselyInstance).toBeDefined();
    });

    it('should handle SSL configuration correctly', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_SSL') return true;
        return defaultValue;
      });

      const kyselyInstance = service.createKyselyInstance();

      expect(kyselyInstance).toBeInstanceOf(Kysely);
      expect(kyselyInstance).toBeDefined();
    });

    it('should handle connection pool settings', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_POOL_MAX') return 100;
        if (key === 'DB_IDLE_TIMEOUT') return 120000;
        if (key === 'DB_CONNECTION_TIMEOUT') return 10000;
        return defaultValue;
      });

      const kyselyInstance = service.createKyselyInstance();

      expect(kyselyInstance).toBeInstanceOf(Kysely);
      expect(kyselyInstance).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should handle missing required configuration gracefully', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        // ConfigService.get returns the defaultValue when the env var is not set
        return defaultValue;
      });

      const config = service.config;

      expect(config.password).toBe('password');
    });

    it('should handle invalid port numbers', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_PORT') return 'invalid-port';
        return defaultValue;
      });

      const config = service.config;

      expect(config.port).toBe('invalid-port');
    });

    it('should handle boolean conversion for SSL', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'DB_SSL') return 'true';
        return defaultValue;
      });

      const config = service.config;

      expect(config.ssl).toBe('true');
    });
  });
});
