import { Controller } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileDto } from './dto/file.dto';
import { Files } from './files.model';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  //add image as preview, return file's full path
  @MessagePattern({ cmd: 'add-preview-image'})
  addImageAsPreview(@Payload() image: Buffer): Promise<string> {
    return this.filesService.addImageAsPreview(image);
  }

  //bind image to essence
  @MessagePattern({ cmd: 'bind-image-to-essence'})
  bindImageToEssence(@Payload() fileDto: FileDto): Promise<Files> {
    return this.filesService.bindImageToEssence(fileDto);
  }

  
  @MessagePattern({ cmd: 'clean-preview-folder' })
  cleanPreviewFolder() {
    return this.filesService.cleanPreviewFolder();
  }
}
