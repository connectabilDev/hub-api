import { Module } from '@nestjs/common';
import { CommunityController } from './infrastructure/controllers/community.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommunityController],
  providers: [],
  exports: [],
})
export class CommunityModule {}
