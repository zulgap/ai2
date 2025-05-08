import { Controller, Patch, Param, Body, Get } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('workflow-executions')
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly prisma: PrismaService
  ) {}

  // 실행 상태 변경 (진행중/완료/실패 등)
  @Patch(':executionId/status')
  async updateStatus(
    @Param('executionId') executionId: string,
    @Body() body: { status: 'RUNNING' | 'COMPLETED' | 'FAILED'; error?: string }
  ) {
    return this.executionService.updateStatus(executionId, body.status, body.error);
  }

  // 실행 정보 조회
  @Get(':executionId')
  async getExecution(@Param('executionId') executionId: string) {
    // 직접 Prisma로 조회
    return this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: true,
        conversations: {
          include: {
            messages: true,
          },
        },
      },
    });
  }

  // 워크플로우별 실행 목록 조회
  @Get('workflow/:workflowId')
  async getExecutionsByWorkflow(@Param('workflowId') workflowId: string) {
    // 직접 Prisma로 조회
    return this.prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      include: {
        workflow: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}