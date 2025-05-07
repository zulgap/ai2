import { Controller, Post, Patch, Param, Body } from '@nestjs/common';
import { ExecutionService } from './execution.service';

@Controller('workflow-executions')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post(':workflowId/execute')
  async executeWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body: { userId: string; input?: any }
  ) {
    // userId는 프론트에서 전달받거나 인증에서 추출
    return this.executionService.execute(workflowId, body.userId, body.input);
  }

  // 실행 상태 변경 (진행중/완료/실패 등)
  @Patch(':executionId/status')
  async updateStatus(
    @Param('executionId') executionId: string,
    @Body() body: { status: 'RUNNING' | 'COMPLETED' | 'FAILED'; error?: string }
  ) {
    return this.executionService.updateStatus(executionId, body.status, body.error);
  }
}