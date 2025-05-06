import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { TeamDocumentService } from './team-document.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('team-documents')
export class TeamDocumentController {
  constructor(private readonly teamDocService: TeamDocumentService) {}

  // 문서 상세 조회
  @Get(':teamId/:documentId')
  async findOneByTeam(
    @Param('teamId') teamId: string,
    @Param('documentId') documentId: string
  ) {
    return this.teamDocService.findOneByTeam(teamId, documentId);
  }

  // 문서 생성
  @Post(':teamId')
  @UseInterceptors(FileInterceptor('file'))
  async createForTeam(
    @Param('teamId') teamId: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.teamDocService.createForTeam(teamId, data, file);
  }

  // relations 배열 일괄 저장
  @Post(':teamId/relations')
  async saveRelations(
    @Param('teamId') teamId: string,
    @Body() body: { relations: any[] }
  ) {
    return this.teamDocService.saveRelations(teamId, body.relations);
  }

  // 문서 삭제
  @Delete(':teamId/:documentId')
  async removeFromTeam(
    @Param('teamId') teamId: string,
    @Param('documentId') documentId: string
  ) {
    return this.teamDocService.removeFromTeam(teamId, documentId);
  }

  // 기타 문서 관련 기능(예: RAG 문서 등)은 이 컨트롤러에 둡니다.
}