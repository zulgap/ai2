import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractTextFromFile } from './extractTextFromFile';

@Controller('extract-text')
export class ExtractTextController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async extract(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: '파일이 필요합니다.' };
    }
    const text = await extractTextFromFile(file);
    return { text };
  }
}