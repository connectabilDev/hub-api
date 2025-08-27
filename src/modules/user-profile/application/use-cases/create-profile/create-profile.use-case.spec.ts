import { CreateProfileUseCase } from './create-profile.use-case';
import { UserProfile } from '../../../domain/entities/user-profile.entity';
import type { UserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { CreateProfileDto } from '../../dtos/create-profile.dto';

describe('CreateProfileUseCase', () => {
  let useCase: CreateProfileUseCase;
  let repository: jest.Mocked<UserProfileRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByLogtoUserId: jest.fn(),
      findByCpf: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByLogtoUserId: jest.fn(),
      existsByCpf: jest.fn(),
    };

    useCase = new CreateProfileUseCase(repository);
  });

  describe('execute', () => {
    const dto: CreateProfileDto = {
      logtoUserId: 'logto_user_123',
      fullName: 'João Silva Santos',
    };

    it('should create profile successfully', async () => {
      const expectedProfile = UserProfile.create(dto.logtoUserId, dto.fullName);

      repository.findByLogtoUserId.mockResolvedValue(null);
      repository.save.mockResolvedValue(expectedProfile);

      const result = await useCase.execute(dto);

      expect(repository.findByLogtoUserId).toHaveBeenCalledWith(
        dto.logtoUserId,
      );
      expect(repository.save).toHaveBeenCalledWith(expect.any(UserProfile));
      expect(result).toEqual(expectedProfile);
    });

    it('should throw error if profile already exists', async () => {
      const existingProfile = UserProfile.create(dto.logtoUserId, dto.fullName);

      repository.findByLogtoUserId.mockResolvedValue(existingProfile);

      await expect(useCase.execute(dto)).rejects.toThrow(
        `Profile already exists for user: ${dto.logtoUserId}`,
      );

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should create profile with correct data', async () => {
      repository.findByLogtoUserId.mockResolvedValue(null);
      repository.save.mockImplementation((profile) => Promise.resolve(profile));

      await useCase.execute(dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getLogtoUserId: expect.any(Function),
          getFullName: expect.any(Function),
        }),
      );

      const savedProfile = repository.save.mock.calls[0][0];
      expect(savedProfile.getLogtoUserId()).toBe(dto.logtoUserId);
      expect(savedProfile.getFullName()).toBe(dto.fullName);
    });
  });
});
