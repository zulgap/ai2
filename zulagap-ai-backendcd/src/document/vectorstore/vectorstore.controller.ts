// 예시: src/document/vectorstore/vectorstore.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { processAndStoreTextToVectorStore } from './vectorstore.service';
import { VectorSearchService } from './vectorstore.service';

@Controller('vectorstore')
export class VectorStoreController {
  // RagService는 사용하지 않으므로 생성자에서 제거

  // 문서 텍스트를 받아 벡터스토어에 저장하는 엔드포인트
  @Post('store')
  async storeToVectorStore(
    @Body() body: { text: string; meta?: Record<string, any> }
  ) {
    const { text, meta } = body;
    // 텍스트 → 청크 → 임베딩 → 벡터스토어 저장
    return await processAndStoreTextToVectorStore(text, meta || {});
  }
}

@Controller('api/vector-search')
export class VectorSearchController {
  constructor(private readonly vectorSearchService: VectorSearchService) {}

  @Post()
  async search(@Body() body: any) {
    // body: { query, subjectId, subjectType, chatHistory }
    return this.vectorSearchService.search(body);
  }
}