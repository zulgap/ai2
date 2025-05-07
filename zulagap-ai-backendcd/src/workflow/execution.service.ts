import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus } from '@prisma/client';

@Injectable()
export class ExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(workflowId: string, userId: string, input?: any) {
    // 워크플로우 정보 조회 (리더 agentId 등 필요시)
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true },
    });
    if (!workflow) throw new Error('Workflow not found');

    // 1. AgentSession 생성
    const agentSession = await this.prisma.agentSession.create({
      data: {
        agentId: workflow.leaderAgentId ?? workflow.agentId ?? '', // 워크플로우 리더 agentId
        userId,
        messages: [],
        status: 'RUNNING',
      },
    });

    // 2. WorkflowExecution 생성
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        userId,
        agentSessionId: agentSession.id,
        status: WorkflowStatus.RUNNING,
        input: input ?? {},
      },
    });

    // 3. Conversation 생성 (첫 노드 기준)
    const firstNode = workflow.nodes.sort((a, b) => a.order - b.order)[0];
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        agentId: workflow.leaderAgentId ?? workflow.agentId ?? '',
        workflowExecutionId: execution.id,
        nodeId: firstNode?.id ?? '',
        title: `워크플로우 실행 #${execution.id}`,
      },
    });

    // 4. Message 생성 (옵션: 실행 시작 메시지)
    const message = await this.prisma.message.create({
      data: {
        content: '워크플로우 실행이 시작되었습니다.',
        role: 'SYSTEM',
        conversationId: conversation.id,
        nodeId: firstNode?.id ?? null,
        agentId: workflow.leaderAgentId ?? workflow.agentId ?? null,
        workflowExecutionId: execution.id,
      },
    });

    // 결과 반환
    return {
      execution,
      agentSession,
      conversation,
      message,
    };
  }

  // 실행 상태 변경
  async updateStatus(
    executionId: string,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED',
    error?: string
  ) {
    return this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        ...(status === 'FAILED' && error ? { error } : {}),
        ...(status === 'COMPLETED' ? { endedAt: new Date() } : {}),
      },
    });
  }
}