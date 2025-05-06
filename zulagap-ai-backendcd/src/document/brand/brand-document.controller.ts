import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandDocumentService } from './brand-document.service';

@Controller('brands/:brandId/documents')
export class BrandDocumentController {
  constructor(private readonly brandDocService: BrandDocumentService) {}

  @Get()
  async findAllByBrand(@Param('brandId') brandId: string) {
    return this.brandDocService.findAllByBrand(brandId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createForBrand(
    @Param('brandId') brandId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    console.log('file:', file); // ← 추가
    console.log('body:', body); // ← 추가
    return this.brandDocService.createForBrand(brandId, { ...body, file });
  }

  @Delete(':documentId')
  async removeFromBrand(@Param('brandId') brandId: string, @Param('documentId') documentId: string) {
    return this.brandDocService.removeFromBrand(brandId, documentId);
  }
}