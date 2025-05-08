import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfirmService {
  constructor(private readonly prisma: PrismaService) {}

  // 컨펌 생성
  async createConfirm(data: {
    workflowExecutionId: string;
    nodeId: string;
    agentId: string;
    status: string; // 'approved', 'rejected', 'pending' 등
    reason?: string;
  }) {
    return this.prisma.agentConfirm.create({ data });
  }

  // 컨펌 수정
  async updateConfirm(id: string, data: { status?: string; reason?: string }) {
    return this.prisma.agentConfirm.update({
      where: { id },
      data,
    });
  }

  // 컨펌 조회 (실행 기준)
  async getConfirmsByExecution(workflowExecutionId: string) {
    return this.prisma.agentConfirm.findMany({
      where: { workflowExecutionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 컨펌 조회 (노드 기준)
  async getConfirmsByNode(nodeId: string) {
    return this.prisma.agentConfirm.findMany({
      where: { nodeId },
      orderBy: { createdAt: 'asc' },
    });
  }
}