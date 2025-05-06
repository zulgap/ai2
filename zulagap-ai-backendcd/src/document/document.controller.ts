import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AgentService } from '../agent/agent.service';
import { BrandService } from '../brand/brand.service';
import { DocumentRelationsService } from '../document-relation/document-relation.service';
import { TeamService } from '../teams/teams.service';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly agentService: AgentService,
    private readonly teamService: TeamService,
    private readonly brandService: BrandService,
    private readonly documentRelationsService: DocumentRelationsService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    const metadata = typeof body.metadata === 'string'
      ? JSON.parse(body.metadata)
      : (body.metadata ?? null);

    return this.documentService.create({
      title: body.title,
      content: body.content,
      size: body.size,
      mimetype: body.mimetype,
      teamId: body.teamId,
      brandId: body.brandId,
      userId: body.userId,
      workflowId: body.workflowId,
      metadata,
      relations: body.relations,
      embedding: body.embedding,
      agentId: body.agentId,
      source: body.source,
    });
  }

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Get(':id/chunks')
  async getChunksStatus(@Param('id') documentId: string) {
    return this.documentService.getChunksStatus(documentId);
  }

  @Get(':id/with-relations')
  async findOneWithRelations(@Param('id') id: string) {
    return this.documentService.findOneWithRelations(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    console.log('[uploadDocument] file:', file);
    console.log('[uploadDocument] body:', body);
    try {
      const result = await this.documentService.handleUpload(file, body);
      console.log('[uploadDocument] result:', result);
      return result;
    } catch (e) {
      console.error('[uploadDocument] error:', e);
      throw e;
    }
  }

  @Post('upload-with-relations')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWithRelations(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    // 1. 문서 생성
    const document = await this.documentService.handleUpload(file, body);

    // 2. 관계 정보가 있으면 관계도 생성
    if (body.relations) {
      const relations = typeof body.relations === 'string'
        ? JSON.parse(body.relations)
        : body.relations;
      for (const rel of relations) {
        await this.documentRelationsService.create({
          fromId: document.id,
          toId: rel.toId,
          type: rel.type,
          prompt: rel.prompt,
          seq: rel.seq,
          brandId: rel.brandId,
        });
      }
    }

    await this.documentService.regenChunks(String(document.id));

    return document;
  }

  // 문서 단위 벡터 검색
  @Post('search')
  async searchSimilar(@Body() body: { query: string; topK?: number }) {
    return this.documentService.searchSimilarChunks(body.query, body.topK || 5);
  }

  // 문서 단위 RAG 검색
  @Post('rag')
  async answerWithRAG(@Body() body: { query: string; brandId: string; topK?: number }) {
    return this.documentService.answerWithRAG(body.query, body.brandId, body.topK || 5);
  }

  // 문서 임베딩/청크 재생성 엔드포인트
  @Post(':id/regen-chunks')
  async regenChunks(@Param('id') id: string) {
    // 실제 재생성 로직은 documentService에 구현
    return this.documentService.regenChunks(id);
  }
}