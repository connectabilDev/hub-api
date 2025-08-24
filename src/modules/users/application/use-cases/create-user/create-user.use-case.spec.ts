import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserUseCase } from './create-user.use-case';
import {
  UserRepositoryInterface,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    userRepository = module.get(USER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should create a user successfully', async () => {
      const mockUser = UserEntity.create({
        id: '123',
        email: createUserDto.email,
        name: createUserDto.name,
      });

      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await useCase.execute(createUserDto);

      expect(userRepository.existsByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(useCase.execute(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.existsByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });
});
