import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '@app/common/rmq/shared.module';
import { AtGuard } from './guards';
import { RtStrategy, AtStrategy } from './strategies';

@Module({
  imports: [
    SharedModule.registerRmq('AUTH_SERVICE', 'auth_queue'),
    SharedModule.registerRmq('PROFILE_SERVICE', 'profile_queue'),
    JwtModule.register({ 
      global: true, 
      secret: process.env.ACCESS_TOKEN_SECRET_KEY || 'at-secret' }),
  ],
  controllers: [ApiController],
  providers: [
    RtStrategy,
    AtStrategy,
    AtGuard,
  ],
})
export class ApiModule {}
