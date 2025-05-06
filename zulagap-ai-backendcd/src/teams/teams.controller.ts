import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamService } from './teams.service';
import { TeamDocumentService, TeamRagService } from './teams.service';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(
    private readonly teamService: TeamService,
    private readonly teamDocumentService: TeamDocumentService,
    private readonly teamRagService: TeamRagService,
  ) {}

  @Get()
  async findAll(@Query('brandId') brandId?: string) {
    if (brandId) return this.teamService.findAllByBrand(brandId);
    return this.teamService.findAll();
  }

  @Post()
  @ApiBody({ type: CreateTeamDto })
  async create(@Body() body: any) {
    return { success: true, team: await this.teamService.create(body) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<CreateTeamDto>) {
    return this.teamService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }

  // 팀별 문서 "목록"만 조회
  @Get(':teamId/documents')
  getDocuments(@Param('teamId') teamId: string) {
    return this.teamService.getDocuments(teamId);
  }

  @Get(':teamId/documents/:docId')
  getDocument(
    @Param('teamId') teamId: string,
    @Param('docId') docId: string,
  ) {
    return this.teamDocumentService.findOneByTeam(teamId, docId);
  }

  // 팀별 에이전트 목록 조회
  @Get(':teamId/agents')
  getAgents(@Param('teamId') teamId: string) {
    return this.teamService.getAgents(teamId);
  }

  // 팀별 워크플로우 목록 조회
  @Get(':teamId/workflows')
  getWorkflows(@Param('teamId') teamId: string) {
    return this.teamService.getWorkflows(teamId);
  }

  // 팀별 문서 업로드 (브랜드와 동일하게)
  @Post(':teamId/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentForTeam(
    @Param('teamId') teamId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file || !body?.title) {
      console.error('[TeamsController] 업로드 실패: file 또는 title 누락', { file, body });
      throw new BadRequestException('file 또는 title이 누락되었습니다.');
    }
    return this.teamDocumentService.createForTeam(teamId, { ...body, file });
  }

  // 팀별 문서 업로드/조회/삭제 등도 브랜드와 동일하게 구현
  // 팀별 RAG 검색
  @Post(':id/vector-search')
  async ragSearch(@Param('id') id: string, @Body() body: any) {
    return this.teamRagService.answerWithRAG(body.query, id, 'team', body.topK, body.chatHistory);
  }
}