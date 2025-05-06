import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DocumentRelationsService } from './document-relation.service';
import { CreateDocumentRelationDto } from './dto/create-document-relation.dto';

@Controller('document-relations')
export class DocumentRelationController {
  constructor(private readonly service: DocumentRelationsService) {}

  @Post()
  async create(@Body() dto: CreateDocumentRelationDto) {
    console.log('[BACK] document-relation.controller POST dto:', dto);
    try {
      const result = await this.service.create(dto);
      console.log('[BACK] document-relation.controller result:', result);
      if (!result || !result.id) {
        throw new BadRequestException('관계 저장 실패: DB에 저장된 id가 없습니다.');
      }
      return result;
    } catch (e) {
      console.error('[BACK] document-relation.controller error:', e);
      throw e;
    }
  }

  // 필요하다면 여기에 다른 라우트 메서드도 추가
}