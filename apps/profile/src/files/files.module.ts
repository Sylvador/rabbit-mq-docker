import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Files } from './files.model';
import { FilesController } from './files.controller';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
  imports: [SequelizeModule.forFeature([Files])]
})
export class FilesModule {}
