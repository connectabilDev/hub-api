import {
  Controller,
  Get,
  Post,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
import { CompleteOnboardingUseCase } from '../../application/use-cases/complete-onboarding/complete-onboarding.use-case';
import { UserProfileMapper } from '../../application/mappers/user-profile.mapper';
import { ProfileResponseDto } from '../../application/dtos/profile-response.dto';
import type { CurrentUserData } from '../../../organization/infrastructure/decorators/current-user.decorator';
import { CurrentUser } from '../../../organization/infrastructure/decorators/current-user.decorator';

export interface OnboardingStatusResponse {
  currentStep: string;
  isCompleted: boolean;
  missingFields: string[];
  completionPercentage: number;
}

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('api/v1/onboarding')
@UseInterceptors(ClassSerializerInterceptor)
export class OnboardingController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
    private readonly userProfileMapper: UserProfileMapper,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get onboarding status',
    description:
      'Retrieves the current onboarding status for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding status retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async getOnboardingStatus(
    @CurrentUser() user: CurrentUserData,
  ): Promise<OnboardingStatusResponse> {
    const profile = await this.getProfileUseCase.executeByLogtoUserId(user.id);
    const missingFields = profile.getMissingRequiredFields();
    const totalRequiredFields = 5; // fullName, cpf, rg, birthDate, phone
    const completedFields = totalRequiredFields - missingFields.length;
    const completionPercentage = Math.round(
      (completedFields / totalRequiredFields) * 100,
    );

    return {
      currentStep: profile.getOnboardingStep(),
      isCompleted: profile.isProfileComplete(),
      missingFields,
      completionPercentage,
    };
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete onboarding',
    description:
      'Marks the onboarding process as completed for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding completed successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Profile is incomplete - cannot complete onboarding',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
  })
  async completeOnboarding(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ProfileResponseDto> {
    const profile = await this.completeOnboardingUseCase.executeByLogtoUserId(
      user.id,
    );
    return this.userProfileMapper.toDto(profile);
  }
}
