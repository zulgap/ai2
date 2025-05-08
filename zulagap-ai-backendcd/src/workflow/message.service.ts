import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageRole } from '@prisma/client'; // enum import

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  // 메시지 생성
  async createMessage(data: {
    content: string;
    role: MessageRole; // string → MessageRole
    conversationId: string;
    nodeId?: string;
    agentId?: string;
    workflowExecutionId?: string;
  }) {
    return this.prisma.message.create({ data });
  }

  // 메시지 조회 (대화방 기준)
  async getMessagesByConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 메시지 조회 (실행 기준)
  async getMessagesByExecution(workflowExecutionId: string) {
    return this.prisma.message.findMany({
      where: { workflowExecutionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}