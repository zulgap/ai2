// 예시: src/document/vectorstore/vectorstore.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { VectorSearchService } from './vectorstore.service';
import { VectorStoreService } from './vectorstore.service';
import { Injectable } from '@nestjs/common';

@Controller('vectorstore')
export class VectorStoreController {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  // 문서 텍스트를 받아 벡터스토어에 저장하는 엔드포인트
  @Post('store')
  async storeToVectorStore(
    @Body() body: { text: string; meta?: Record<string, any> }
  ) {
    const { text, meta } = body;
    // 텍스트 → 청크 → 임베딩 → 벡터스토어 저장
    return await this.vectorStoreService.processAndStoreTextToVectorStore(text, meta || {});
  }
}

@Controller('vector-search')
export class VectorSearchController {
  constructor(private readonly vectorSearchService: VectorSearchService) {}

  @Post()
  async search(@Body() body: any) {
    // body: { query, subjectId, subjectType, chatHistory }
    return this.vectorSearchService.search(body);
  }
}