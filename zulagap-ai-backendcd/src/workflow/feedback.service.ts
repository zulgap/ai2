import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  // 피드백 생성
  async createFeedback(data: {
    workflowExecutionId: string;
    nodeId: string;
    fromAgentId: string;
    toAgentId: string;
    feedbackType: string;
    content: string;
  }) {
    return this.prisma.agentFeedback.create({ data });
  }

  // 피드백 조회 (워크플로우 실행 기준)
  async getFeedbacksByExecution(workflowExecutionId: string) {
    return this.prisma.agentFeedback.findMany({
      where: { workflowExecutionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 피드백 조회 (노드 기준)
  async getFeedbacksByNode(nodeId: string) {
    return this.prisma.agentFeedback.findMany({
      where: { nodeId },
      orderBy: { createdAt: 'asc' },
    });
  }
}