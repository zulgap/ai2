import { Controller, Post, Body, Logger } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('vector-search')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  @Post()
  async vectorSearch(@Body() body) {
    this.logger.log(`[CONTROLLER] POST /api/vector-search 호출, body: ${JSON.stringify(body)}`);
    try {
      const result = await this.ragService.answerWithRAG(
        body.query,
        body.subjectId,
        body.subjectType,
        5,
        body.chatHistory,
      );
      this.logger.log(`[CONTROLLER] RAG 결과 반환: ${JSON.stringify(result).slice(0, 300)}...`);
      return result;
    } catch (e) {
      this.logger.error(`[CONTROLLER] RAG 처리 중 오류: ${e?.message || e}`);
      throw e;
    }
  }
}