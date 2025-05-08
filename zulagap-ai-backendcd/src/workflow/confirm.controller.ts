import { Controller, Post, Patch, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { ConfirmService } from './confirm.service';

@Controller('confirms')
export class ConfirmController {
  constructor(private readonly confirmService: ConfirmService) {}

  // 컨펌 생성
  @Post()
  async create(@Body() body: {
    workflowExecutionId: string;
    nodeId: string;
    agentId: string;
    status: string;
    reason?: string;
  }) {
    if (!body.nodeId) {
      throw new BadRequestException('nodeId는 필수입니다.');
    }
    return this.confirmService.createConfirm(body);
  }

  // 컨펌 수정
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { status?: string; reason?: string }) {
    return this.confirmService.updateConfirm(id, body);
  }

  // 실행 기준 컨펌 조회
  @Get('execution/:executionId')
  async getByExecution(@Param('executionId') executionId: string) {
    return this.confirmService.getConfirmsByExecution(executionId);
  }

  // 노드 기준 컨펌 조회
  @Get('node/:nodeId')
  async getByNode(@Param('nodeId') nodeId: string) {
    return this.confirmService.getConfirmsByNode(nodeId);
  }
}

