import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentDocumentService {
  constructor(private prisma: PrismaService) {}

  // 에이전트별 문서 목록 조회
  async findAllByAgent(agentId: string) {
    return this.prisma.document.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 에이전트별 문서 생성
  async createForAgent(agentId: string, data: any) {
    return this.prisma.document.create({
      data: {
        ...data,
        agentId,
      },
    });
  }

  // 에이전트별 문서 삭제
  async removeFromAgent(agentId: string, documentId: string) {
    return this.prisma.document.deleteMany({
      where: { id: documentId, agentId },
    });
  }

  // 에이전트별 RAG 문서 목록 (예시)
  async getAgentRagDocs(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent?.ragDocs) return [];
    return this.prisma.document.findMany({
      where: { id: { in: agent.ragDocs } },
    });
  }
}