import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'apps/auth/src/auth.module';
import { FilesModule } from './files/files.module';
import { ConfigModule } from '@nestjs/config';
import { Profile } from '@app/common/database/profile.model';
import { SharedModule } from '@app/common/rmq/shared.module';
import { APP_FILTER } from '@nestjs/core';
import { GrpcServerExceptionFilter } from 'nestjs-grpc-exceptions';
import { Files } from './files/files.model';

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
      name: 'profile',
      dialect: 'postgres',
      host: '',
      port: 5432,
      username: 'postgres',
      password: 'rootroot',
      database: 'nestjwtprofile',
      models: [Profile, Files],
      autoLoadModels: true,
    }),
    SequelizeModule.forFeature([Profile, Files], 'profile'),
    AuthModule,
    FilesModule,
    SharedModule.registerRmq('PROFILE_SERVICE', 'profile_queue'),
    SharedModule.registerRmq('AUTH_SERVICE', 'auth_queue'),
  ],
  exports: [
    ProfileService,
  ]
})
export class ProfileModule {}