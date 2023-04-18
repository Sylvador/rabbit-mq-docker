import { Module, forwardRef } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from '@app/common/database/roles.model';
import { UserRoles } from '@app/common/database/user-roles.model';
import { User } from '@app/common/database/user.model';
import { AuthModule } from '../auth.module';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  imports: [
    SequelizeModule.forFeature([Role, User, UserRoles], 'auth'),
    forwardRef(() => AuthModule)
  ],
  exports: [
    RolesService,
  ]
})
export class RolesModule {}
