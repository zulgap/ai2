import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { WorkflowService } from '../workflow/workflow.service';
import { MessageRole } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WorkflowService))
    private workflowService: WorkflowService,
  ) {}

  create(dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId: dto.userId,
        agentId: dto.agentId,
        title: dto.title,
        workflowExecutionId: dto.workflowExecutionId ?? null,
        nodeId: dto.nodeId,
      }
    });
  }

  async findAll(filter: { workflowExecutionId?: string; userId?: string; agentId?: string }) {
    return this.prisma.conversation.findMany({
      where: {
        ...(filter.workflowExecutionId && { workflowExecutionId: filter.workflowExecutionId }),
        ...(filter.userId && { userId: filter.userId }),
        ...(filter.agentId && { agentId: filter.agentId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateConversationDto) {
    return this.prisma.conversation.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.conversation.delete({ where: { id } });
  }

  async findByWorkflowExecutionId(workflowExecutionId: string) {
    return this.prisma.conversation.findMany({
      where: { workflowExecutionId },
      include: { messages: true },
    });
  }

  async saveMessage(data: {
    conversationId: string;
    nodeId: string;
    agentId: string;
    content: string;
    role: MessageRole;
    workflowExecutionId: string; // ← 추가
  }) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        nodeId: data.nodeId,
        agentId: data.agentId,
        content: data.content,
        role: data.role,
        workflowExecutionId: data.workflowExecutionId, // ← 추가
        createdAt: new Date(),
      },
    });
  }
}