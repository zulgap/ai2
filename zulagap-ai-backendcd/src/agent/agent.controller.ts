import { Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { AgentRole } from '@prisma/client'; // 상단에 추가
import { DocumentService } from '../document/document.service';
import { AgentDocumentService } from '../document/agent/agent-document.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly documentService: DocumentService,
    private readonly agentDocumentService: AgentDocumentService,
  ) {}

  // 에이전트 생성
  @Post()
  async create(@Body() body: any) {
    try {
      const { userId, teamId, brandId, role, ...rest } = body;
      this.agentService['logger']?.log('[AgentController] 에이전트 생성 요청 수신');
      const result = await this.agentService.create({
        ...rest,
        ...(userId ? { userId } : {}),
        ...(teamId && { teamId }),
        ...(brandId && { brandId }),
        ...(role && { role }),
      });
      this.agentService['logger']?.log('[AgentController] 에이전트 생성 성공');
      return result;
      
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 생성 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 생성 중 오류가 발생했습니다.');
    }
  }

  // 에이전트 전체 조회
  @Get()
  async findAll(@Query('teamId') teamId?: string, @Query('workflowId') workflowId?: string) {
    try {
      this.agentService['logger']?.log('[AgentController] 에이전트 전체 조회 요청');
      return await this.agentService.findAll({ teamId, workflowId });
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 전체 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 에이전트 단일 조회
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 단일 조회: id=${id}`);
      return await this.agentService.findOne(id);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 단일 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 조회 중 오류가 발생했습니다.');
    }
  }

  // 에이전트 수정
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 수정 요청: id=${id}`);
      const { role, ...rest } = body;
      return await this.agentService.update(id, {
        ...rest,
        ...(role && { role }),
      });
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 수정 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 수정 중 오류가 발생했습니다.');
    }
  }

  // 에이전트 삭제
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 삭제 요청: id=${id}`);
      return await this.agentService.remove(id);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 삭제 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 삭제 중 오류가 발생했습니다.');
    }
  }

  // === 확장 API 시작 ===

  // 1. 에이전트별 AI 채팅
  @Post(':id/chat')
  async chatWithAgent(
    @Param('id') agentId: string,
    @Body() body: { message: string; context?: any }
  ) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 채팅 요청: id=${agentId}`);
      return await this.agentService.chatWithAgent(agentId, body.message, body.context);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 채팅 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 채팅 중 오류가 발생했습니다.');
    }
  }

  // 2. 에이전트의 자식(하위) 에이전트 조회
  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 자식 조회: id=${id}`);
      return await this.agentService.getChildrenAgents(id);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 자식 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 자식 조회 중 오류가 발생했습니다.');
    }
  }

  // 3. 에이전트의 부모(상위) 에이전트 조회
  @Get(':id/parent')
  async getParent(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 부모 조회: id=${id}`);
      return await this.agentService.getParentAgent(id);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 부모 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 부모 조회 중 오류가 발생했습니다.');
    }
  }

  // 4. 타입별 에이전트 목록 조회
  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 타입 조회: type=${type}`);
      return await this.agentService.findByType(type);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 타입 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 타입 조회 중 오류가 발생했습니다.');
    }
  }

  // 5. 에이전트 미션/프롬프트/RAG/아이덴티티 조회
  @Get(':id/mission')
  async getMission(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 미션 조회: id=${id}`);
      return await this.agentService.getMission(id);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 미션 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 미션 조회 중 오류가 발생했습니다.');
    }
  }

  // 6. 에이전트 미션/프롬프트/RAG/아이덴티티 수정
  @Patch(':id/mission')
  async updateMission(
    @Param('id') id: string,
    @Body() body: { prompt?: string; ragDocs?: string[]; identity?: any }
  ) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 미션 수정: id=${id}`);
      return await this.agentService.updateMission(id, body);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 미션 수정 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 미션 수정 중 오류가 발생했습니다.');
    }
  }

  // 7. 에이전트 검색/필터
  @Get('search')
  async searchAgents(@Query() query: { teamId?: string; role?: string; type?: string }) {
    try {
      this.agentService['logger']?.log('[AgentController] 에이전트 검색 요청');
      return await this.agentService.searchAgents(query);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 검색 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 검색 중 오류가 발생했습니다.');
    }
  }

  @Get(':id/rag-docs')
  async getRagDocsDetail(@Param('id') id: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 RAG 문서 조회: id=${id}`);
      const agent = await this.agentService.findOne(id);
      if (!agent?.ragDocs) return [];
      // DocumentService를 주입받아 사용해야 합니다.
      return await this.documentService.getDocumentsWithRelations(agent.ragDocs);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 RAG 문서 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 RAG 문서 조회 중 오류가 발생했습니다.');
    }
  }

  // === 에이전트 문서 관련 API ===

  // 1. 에이전트별 문서 목록 조회
  @Get(':agentId/documents')
  async getDocuments(@Param('agentId') agentId: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 문서 목록 조회: agentId=${agentId}`);
      return await this.agentDocumentService.findAllByAgent(agentId);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 문서 목록 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 문서 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 2. 에이전트별 문서 생성
  @Post(':agentId/documents')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @Param('agentId') agentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 문서 생성 요청: agentId=${agentId}`);
      return await this.agentDocumentService.createForAgent(agentId, body, file);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 문서 생성 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 문서 생성 중 오류가 발생했습니다.');
    }
  }

  // 3. 에이전트별 문서 삭제
  @Delete(':agentId/documents/:docId')
  async removeDocument(
    @Param('agentId') agentId: string,
    @Param('docId') docId: string,
  ) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 문서 삭제 요청: agentId=${agentId}, docId=${docId}`);
      return await this.agentDocumentService.removeFromAgent(agentId, docId);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 문서 삭제 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 문서 삭제 중 오류가 발생했습니다.');
    }
  }

  // 4. 에이전트별 RAG 문서 목록
  @Get(':agentId/rag-docs')
  async getAgentRagDocs(@Param('agentId') agentId: string) {
    try {
      this.agentService['logger']?.log(`[AgentController] 에이전트 RAG 문서 목록 조회: agentId=${agentId}`);
      return await this.agentDocumentService.getAgentRagDocs(agentId);
    } catch (err) {
      this.agentService['logger']?.error(`[AgentController] 에이전트 RAG 문서 목록 조회 실패: ${err?.message}`);
      throw new BadRequestException('에이전트 RAG 문서 목록 조회 중 오류가 발생했습니다.');
    }
  }
}

@Module({
  controllers: [AgentController],
  providers: [AgentService, PrismaService, DocumentService, AgentDocumentService],
  exports: [AgentService],
})
export class AgentModule {}