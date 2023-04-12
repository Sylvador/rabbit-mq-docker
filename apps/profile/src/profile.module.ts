import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'apps/auth/src/auth.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { Profile } from '@app/common/database/profile.model';
import { Role } from '@app/common/database/roles.model';
import { UserRoles } from '@app/common/database/user-roles.model';
import { User } from '@app/common/database/user.model';
import { RolesModule } from './roles/roles.module';
import { SharedModule } from '@app/common/rmq/shared.module';
import { APP_FILTER } from '@nestjs/core';
import { GrpcServerExceptionFilter } from 'nestjs-grpc-exceptions';

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: APP_FILTER,
      useClass: GrpcServerExceptionFilter,
    },],
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [User, Role, UserRoles, Profile],
      autoLoadModels: true,
    }),
    SequelizeModule.forFeature([Profile]),
    AuthModule,
    FilesModule,
    RolesModule,
    SharedModule.registerRmq('PROFILE_SERVICE', 'profile_queue'),
    SharedModule.registerRmq('AUTH_SERVICE', 'auth_queue'),
  ],
  exports: [
    ProfileService,
  ]
})
export class ProfileModule {}
