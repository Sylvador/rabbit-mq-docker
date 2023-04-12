import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import { InjectModel } from '@nestjs/sequelize';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { Files } from './files.model';
import { FileDto } from './dto/file.dto';
import { Op } from 'sequelize';

@Injectable()
export class FilesService {
  constructor(@InjectModel(Files) private filesRepository: typeof Files) {}
  async createFile(fileBuffer: Buffer, fileDto: FileDto): Promise<string> {
    try {
      const fileName = uuid.v4() + '.jpg';
      const filePath = path.resolve(__dirname, '..', 'static', fileDto.folderName);
      if(!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, {recursive: true});
      }
      const fullPath = path.join(filePath, fileName);
      
      fs.writeFileSync(fullPath, Buffer.from(fileBuffer));
      await this.filesRepository.create({ essenceId: fileDto.essenceId, essenceTable: fileDto.essenceTable, filePath: fullPath });

      return fullPath;
    } catch (e) {
      console.log(e);
      throw new HttpException('Произошла ошибка при записи файла', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
  
  async bindImageToEssence(fileDto: FileDto): Promise<Files> {
    const file = await this.filesRepository.findOne({ where: { filePath: fileDto.fullPath }});
    file.update({ ...fileDto });

    return file;
  }

  async addImageAsPreview(fileBuffer: Buffer): Promise<string> {
    const fileName = uuid.v4() + '.jpg';
    const filePath = path.resolve(__dirname, '..', 'static', 'preview');
    if(!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, {recursive: true});
    }
    const fullPath = path.join(filePath, fileName);

    fs.writeFileSync(fullPath, Buffer.from(fileBuffer));
    const preview = await this.filesRepository.create({ filePath: fullPath });
    return preview.filePath;
  }
  
  async deleteFile(fullPath: string) {
    //const filePath = path.resolve(__dirname, '..', 'static', fullPath);
    await this.filesRepository.destroy({ where: { filePath: fullPath }});
    fs.rmSync(fullPath);
  }

  async deleteFiles(essenceId: number, essenceTable: string) {
    const files = await this.filesRepository.findAll({ where: { essenceId, essenceTable }});
    files.forEach(async file => await this.deleteFile(file.filePath))
  }
  //find files relating to essence
  async findFiles(essenceId: number, essenceTable: string) {
    return await this.filesRepository.findAll({ where: { essenceId, essenceTable }});
  }

  async deleteFilesById(ids: string[]) {
    console.log(ids)
    ids.forEach(async id => await this.filesRepository.destroy({ where: { id }}));
  }
  async cleanPreviewFolder() {
    return await this.filesRepository.destroy({ where: { essenceId: null, essenceTable: null, createdAt: { [Op.lt]: new Date(Date.now() - 3.6e6)}}})
  }
}
