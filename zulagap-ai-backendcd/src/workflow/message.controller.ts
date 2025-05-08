import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'; // 이 부분 추가

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService // PrismaService 주입
  ) {}

  // 메시지 생성
  @Post()
  async create(@Body() body: {
    content: string;
    role: string;
    conversationId: string;
    nodeId?: string;
    agentId?: string;
    workflowExecutionId?: string;
  }) {
    // role을 enum으로 변환
    const { content, role, conversationId, nodeId, agentId, workflowExecutionId } = body;
    return this.messageService.createMessage({
      content,
      role: role as MessageRole,
      conversationId,
      ...(nodeId ? { nodeId } : {}),
      ...(agentId ? { agentId } : {}),
      ...(workflowExecutionId ? { workflowExecutionId } : {})
    });
  }

  // 대화방 기준 메시지 조회
  @Get('conversation/:conversationId')
  async getByConversation(@Param('conversationId') conversationId: string) {
    return this.messageService.getMessagesByConversation(conversationId);
  }

  // 실행 기준 메시지 조회
  @Get('execution/:executionId')
  async getByExecution(@Param('executionId') executionId: string) {
    return this.messageService.getMessagesByExecution(executionId);
  }

  // 실행 기준 메시지 생성
  @Post('execution/:executionId')
  async createForExecution(
    @Param('executionId') executionId: string,
    @Body() body: {
      content: string;
      role: string;
      nodeId?: string;
      agentId?: string;
    }
  ) {
    // 실행 ID로 관련 대화방 조회 또는 생성
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { conversations: true }
    });
    
    if (!execution) {
      throw new NotFoundException(`실행 ID ${executionId}에 해당하는 워크플로우 실행을 찾을 수 없습니다.`);
    }
    
    // 대화방이 없으면 새로 생성
    let conversationId: string;
    if (execution.conversations?.length > 0) {
      conversationId = execution.conversations[0].id;
    } else {
      const conversation = await this.prisma.conversation.create({
        data: {
          workflowExecutionId: executionId,
          // null 대신 조건부로 필드 추가
          ...(body.agentId ? { agentId: body.agentId } : {}),
          ...(body.nodeId ? { nodeId: body.nodeId } : {})
        }
      });
      conversationId = conversation.id;
    }
    
    // 메시지 생성 시 선택적 필드는 값이 있을 때만 전달
    return this.messageService.createMessage({
      content: body.content,
      role: body.role as MessageRole,
      conversationId,
      ...(body.nodeId ? { nodeId: body.nodeId } : {}),
      ...(body.agentId ? { agentId: body.agentId } : {}),
      ...(executionId ? { workflowExecutionId: executionId } : {})
    });
  }
}