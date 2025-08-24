import { Injectable, Inject } from '@nestjs/common';
import type { TokenValidationRepository } from '../../../domain/repositories/token-validation.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { ValidateTokenDto } from '../../dtos/validate-token.dto';

@Injectable()
export class ValidateTokenUseCase {
  constructor(
    @Inject('TOKEN_VALIDATION_REPOSITORY')
    private readonly tokenValidationRepository: TokenValidationRepository,
  ) {}

  async execute(dto: ValidateTokenDto): Promise<User> {
    return this.tokenValidationRepository.validateToken(dto.token);
  }
}
