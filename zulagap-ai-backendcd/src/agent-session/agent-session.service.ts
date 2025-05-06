import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    agentId: string;
    userId: string;
    messages?: any[];
    variables?: any;
    createdAt?: Date;
    updatedAt?: Date;
    status?: string;
    workflowExecutionId?: string;
  }) {
    return this.prisma.agentSession.create({
      data: {
        agentId: data.agentId,
        userId: data.userId,
        messages: data.messages ?? [],
        variables: data.variables ?? {},
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
        status: data.status, // 추가
        // workflowExecutionId는 AgentSession 모델에 직접 필드가 없으므로, 관계 테이블로 연결 필요
      },
    });
  }

  // 필요에 따라 find, update 등 추가 구현
}
