import { Module } from '@nestjs/common';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { AgentRole } from '@prisma/client'; // 상단에 추가
import { DocumentService } from '../document/document.service';

@Controller('api/agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly documentService: DocumentService
  ) {}

  @Post()
  create(@Body() body: any) {
    const { userId, teamId, brandId, role, ...rest } = body;
    return this.agentService.create({
      ...rest,
      ...(userId ? { userId } : {}), // userId가 있을 때만 전달
      ...(teamId && { teamId }),
      ...(brandId && { brandId }),
      ...(role && { role }),
    });
  }

  @Get()
  findAll(
    @Query('teamId') teamId?: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.agentService.findAll({ teamId, workflowId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      teamId?: string;
      userId?: string;
      config?: any;
      isPublic?: boolean;
      identity?: any;
      role?: string;
      ragDocs?: string[];
      prompt?: string;
      model?: string;
      temperature?: number;
      type?: string;
      parentAgentId?: string;
    }
  ) {
    // role이 string이면 Prisma가 요구하는 enum 또는 { set: enum } 형태로 변환
    const { role, ...rest } = body;
    return this.agentService.update(id, {
      ...rest,
      ...(role && { role: { set: role as AgentRole } }),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  // === 확장 API 시작 ===

  // 1. 에이전트별 AI 채팅
  @Post(':id/chat')
  async chatWithAgent(
    @Param('id') agentId: string,
    @Body() body: { message: string; context?: any }
  ) {
    return this.agentService.chatWithAgent(agentId, body.message, body.context);
  }

  // 2. 에이전트의 자식(하위) 에이전트 조회
  @Get(':id/children')
  getChildren(@Param('id') id: string) {
    return this.agentService.getChildrenAgents(id);
  }

  // 3. 에이전트의 부모(상위) 에이전트 조회
  @Get(':id/parent')
  getParent(@Param('id') id: string) {
    return this.agentService.getParentAgent(id);
  }

  // 4. 타입별 에이전트 목록 조회
  @Get('type/:type')
  findByType(@Param('type') type: string) {
    return this.agentService.findByType(type);
  }

  // 5. 에이전트 미션/프롬프트/RAG/아이덴티티 조회
  @Get(':id/mission')
  getMission(@Param('id') id: string) {
    return this.agentService.getMission(id);
  }

  // 6. 에이전트 미션/프롬프트/RAG/아이덴티티 수정
  @Patch(':id/mission')
  updateMission(
    @Param('id') id: string,
    @Body() body: { prompt?: string; ragDocs?: string[]; identity?: any }
  ) {
    return this.agentService.updateMission(id, body);
  }

  // 7. 에이전트 검색/필터
  @Get('search')
  searchAgents(@Query() query: { teamId?: string; role?: string; type?: string }) {
    return this.agentService.searchAgents(query);
  }

  @Get(':id/rag-docs')
  async getRagDocsDetail(@Param('id') id: string) {
    const agent = await this.agentService.findOne(id);
    if (!agent?.ragDocs) return [];
    // DocumentService를 주입받아 사용해야 합니다.
    return this.documentService.getDocumentsWithRelations(agent.ragDocs);
  }
}

@Module({
  controllers: [AgentController],
  providers: [AgentService, PrismaService, DocumentService],
  exports: [AgentService],
})
export class AgentModule {}