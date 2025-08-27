import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileController } from './user-profile.controller';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile/update-profile.use-case';
import { UserProfileMapper } from '../../application/mappers/user-profile.mapper';
import { UserProfile, Gender } from '../../domain/entities/user-profile.entity';
import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';

describe('UserProfileController', () => {
  let controller: UserProfileController;
  let getProfileUseCase: jest.Mocked<GetProfileUseCase>;
  let updateProfileUseCase: jest.Mocked<UpdateProfileUseCase>;
  let mapper: jest.Mocked<UserProfileMapper>;

  beforeEach(async () => {
    const mockGetProfileUseCase = {
      executeById: jest.fn(),
      executeByLogtoUserId: jest.fn(),
    };

    const mockUpdateProfileUseCase = {
      execute: jest.fn(),
      executeByLogtoUserId: jest.fn(),
    };

    const mockMapper = {
      toDto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        { provide: GetProfileUseCase, useValue: mockGetProfileUseCase },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
        { provide: UserProfileMapper, useValue: mockMapper },
      ],
    }).compile();

    controller = module.get<UserProfileController>(UserProfileController);
    getProfileUseCase = module.get(GetProfileUseCase);
    updateProfileUseCase = module.get(UpdateProfileUseCase);
    mapper = module.get(UserProfileMapper);
  });

  describe('getCurrentUserProfile', () => {
    it('should return current user profile', async () => {
      const user = { id: 'logto_user_123' } as any;
      const profile = UserProfile.create(user.id, 'João Silva');
      const expectedDto = { id: 'profile_123', fullName: 'João Silva' } as any;

      getProfileUseCase.executeByLogtoUserId.mockResolvedValue(profile);
      mapper.toDto.mockReturnValue(expectedDto);

      const result = await controller.getCurrentUserProfile(user);

      expect(getProfileUseCase.executeByLogtoUserId).toHaveBeenCalledWith(
        user.id,
      );
      expect(mapper.toDto).toHaveBeenCalledWith(profile);
      expect(result).toBe(expectedDto);
    });
  });

  describe('getProfileById', () => {
    it('should return profile by id', async () => {
      const profileId = 'profile_123';
      const profile = UserProfile.create('logto_user_123', 'João Silva');
      const expectedDto = { id: profileId, fullName: 'João Silva' } as any;

      getProfileUseCase.executeById.mockResolvedValue(profile);
      mapper.toDto.mockReturnValue(expectedDto);

      const result = await controller.getProfileById(profileId);

      expect(getProfileUseCase.executeById).toHaveBeenCalledWith(profileId);
      expect(mapper.toDto).toHaveBeenCalledWith(profile);
      expect(result).toBe(expectedDto);
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const user = { id: 'logto_user_123' } as any;
      const updateDto: UpdateProfileDto = {
        fullName: 'João Silva Santos',
        gender: Gender.MALE,
      };
      const updatedProfile = UserProfile.create(user.id, 'João Silva Santos');
      const expectedDto = {
        id: 'profile_123',
        fullName: 'João Silva Santos',
      } as any;

      updateProfileUseCase.executeByLogtoUserId.mockResolvedValue(
        updatedProfile,
      );
      mapper.toDto.mockReturnValue(expectedDto);

      const result = await controller.updateProfile(updateDto, user);

      expect(updateProfileUseCase.executeByLogtoUserId).toHaveBeenCalledWith(
        user.id,
        updateDto,
      );
      expect(mapper.toDto).toHaveBeenCalledWith(updatedProfile);
      expect(result).toBe(expectedDto);
    });
  });

  describe('partialUpdateProfile', () => {
    it('should partially update profile', async () => {
      const user = { id: 'logto_user_123' } as any;
      const updateDto: UpdateProfileDto = {
        bio: 'Software Engineer',
      };
      const updatedProfile = UserProfile.create(user.id, 'João Silva');
      const expectedDto = {
        id: 'profile_123',
        bio: 'Software Engineer',
      } as any;

      updateProfileUseCase.executeByLogtoUserId.mockResolvedValue(
        updatedProfile,
      );
      mapper.toDto.mockReturnValue(expectedDto);

      const result = await controller.partialUpdateProfile(updateDto, user);

      expect(updateProfileUseCase.executeByLogtoUserId).toHaveBeenCalledWith(
        user.id,
        updateDto,
      );
      expect(mapper.toDto).toHaveBeenCalledWith(updatedProfile);
      expect(result).toBe(expectedDto);
    });
  });
});
