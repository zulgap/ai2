import { Controller, Get, Post, Patch, Delete, Param, Body, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { BrandService } from './brand.service';

@Controller('brands')
export class BrandController {
  private readonly logger = new Logger(BrandController.name);

  constructor(private readonly brandService: BrandService) {}

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      identity?: {
        mission?: string;
        gptType?: string;
        guideline?: string;
        relations?: any;
      };
      documents?: string[];
      ragDocs?: string[];
    }
  ) {
    this.logger.log(`브랜드 생성 요청: ${JSON.stringify(body)}`);
    const brand = await this.brandService.create(body);
    return brand; // id 포함 전체 객체 반환
  }

  @Get()
  async findAll() {
    try {
      return await this.brandService.findAll();
    } catch (e) {
      throw new InternalServerErrorException(e?.message || e);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`findOneWithRagDocs 호출: id=${id}`);
    return this.brandService.findOneWithRagDocs(id);
  }

  @Get(':id/documents/:docId')
  async getBrandDocumentDetail(
    @Param('id') brandId: string,
    @Param('docId') docId: string
  ) {
    this.logger.log(`문서 상세+청크 조회: brandId=${brandId}, docId=${docId}`);
    const doc = await this.brandService.getDocumentDetailWithChunks(brandId, docId);
    if (!doc) {
      this.logger.error(`문서 또는 브랜드를 찾을 수 없음: brandId=${brandId}, docId=${docId}`);
    }
    return doc;
  }

  @Get(':id/ragdocs')
  getRagDocs(@Param('id') id: string) {
    this.logger.log(`브랜드 ragDocs 조회: id=${id}`);
    return this.brandService.getRagDocs(id);
  }

  @Patch(':id/ragdocs')
  updateRagDocs(@Param('id') id: string, @Body() body: { ragDocs: string[] }) {
    this.logger.log(`브랜드 ragDocs 업데이트: id=${id}, ragDocs=${JSON.stringify(body.ragDocs)}`);
    return this.brandService.updateRagDocs(id, body.ragDocs);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      identity?: any;
      documents?: string[];
      ragDocs?: string[];
      teams?: string[];
    }
  ) {
    this.logger.log(`브랜드 수정 요청: id=${id}, body=${JSON.stringify(body)}`);
    return this.brandService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}