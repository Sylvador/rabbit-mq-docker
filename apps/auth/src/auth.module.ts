import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { User } from '@app/common/database/user.model';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { UserRoles } from '@app/common/database/user-roles.model';
import { Role } from '@app/common/database/roles.model';
import { SharedModule } from '@app/common/rmq/shared.module';
import { APP_FILTER } from '@nestjs/core';
import { GrpcServerExceptionFilter } from 'nestjs-grpc-exceptions';
import { RolesModule } from './roles/roles.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_FILTER,
      useClass: GrpcServerExceptionFilter,
    },
  ],
  imports: [
    SharedModule.registerRmq('AUTH_SERVICE', 'auth_queue'),
    SequelizeModule.forRoot({
      name: 'auth',
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST_AUTH,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB_AUTH,
      models: [User, UserRoles, Role],
      autoLoadModels: true,
    }),
    SequelizeModule.forFeature([User, Role], 'auth'),
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    JwtModule.register({ 
      global: true, 
      secret: process.env.ACCESS_TOKEN_SECRET_KEY || 'at-secret' }),
      forwardRef(() => RolesModule)
  ],
  exports: [
    AuthService
  ]
})
export class AuthModule {}
