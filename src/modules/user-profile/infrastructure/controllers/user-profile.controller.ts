import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile/update-profile.use-case';
import { UserProfileMapper } from '../../application/mappers/user-profile.mapper';
import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';
import { ProfileResponseDto } from '../../application/dtos/profile-response.dto';
import type { CurrentUserData } from '../../../organization/infrastructure/decorators/current-user.decorator';
import { CurrentUser } from '../../../organization/infrastructure/decorators/current-user.decorator';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('api/v1/profile')
@UseInterceptors(ClassSerializerInterceptor)
export class UserProfileController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly userProfileMapper: UserProfileMapper,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async getCurrentUserProfile(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ProfileResponseDto> {
    const profile = await this.getProfileUseCase.executeByLogtoUserId(user.id);
    return this.userProfileMapper.toDto(profile);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user profile by ID',
    description: 'Retrieves a user profile by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Profile unique identifier',
    example: 'prof_123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async getProfileById(@Param('id') id: string): Promise<ProfileResponseDto> {
    const profile = await this.getProfileUseCase.executeById(id);
    return this.userProfileMapper.toDto(profile);
  }

  @Put()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the complete profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid profile data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ProfileResponseDto> {
    const profile = await this.updateProfileUseCase.executeByLogtoUserId(
      user.id,
      updateProfileDto,
    );
    return this.userProfileMapper.toDto(profile);
  }

  @Patch()
  @ApiOperation({
    summary: 'Partially update user profile',
    description: 'Partially updates the profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid profile data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async partialUpdateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ProfileResponseDto> {
    const profile = await this.updateProfileUseCase.executeByLogtoUserId(
      user.id,
      updateProfileDto,
    );
    return this.userProfileMapper.toDto(profile);
  }
}
