import { Test } from '@nestjs/testing';
import { FilesService } from '../files.service';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid';
import { getModelToken } from '@nestjs/sequelize';
import { Files } from '../files.model';
describe('FilesService', () => {
  describe('Добавление картинки и удаление', () => {
    let filesService: FilesService;
    const defaultPic = fs.readFileSync(path.resolve(__dirname, 'default.jpg'),);

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [],
        providers: [FilesService, { provide: getModelToken(Files), useValue: { fn: jest.fn() } }],
        controllers: [],
      })
        .compile();

      filesService = await moduleRef.resolve<FilesService>(FilesService);
    });

    let filePath: string;
    test('Добавление превью', async () => {
      const mockAddImageAsPreview = async (file: Buffer) => {
        const fileName = uuid.v4() + '.jpg';
        const filePath = path.resolve(__dirname);

        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath, { recursive: true });
        }
        const fullPath = path.join(filePath, fileName);

        fs.writeFileSync(fullPath, file);

        //Без использования бд
        //const preview = await this.filesRepository.create({ filePath: fullPath });

        return fullPath;
      }

      filePath = await mockAddImageAsPreview(defaultPic);

      const pic = fs.readFileSync(filePath);

      expect(pic).toEqual(defaultPic);
      fs.rmSync(filePath);

    })
    test('Удаление добавленного превью', () => {
      expect(fs.existsSync(filePath)).toEqual(false);
    })
  })
});