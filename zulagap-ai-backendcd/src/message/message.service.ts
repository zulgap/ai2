import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { OpenAI } from 'openai';
import { DocumentService } from '../document/document.service'; // RAG 연동

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService, // 의존성 주입
  ) {}

  create(dto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        content: dto.content,
        role: dto.role,
        conversationId: dto.conversationId,
        nodeId: dto.nodeId,
        agentId: dto.agentId,
        workflowExecutionId: dto.workflowExecutionId,
      }
    });
  }

  findByConversation(conversationId: string) {
    return this.prisma.message.findMany({ where: { conversationId } });
  }

  async findAll(filter: {
    conversationId?: string;
    workflowExecutionId?: string;
    nodeId?: string;
    agentId?: string;
  }) {
    return this.prisma.message.findMany({
      where: {
        ...(filter.conversationId && { conversationId: filter.conversationId }),
        ...(filter.workflowExecutionId && { workflowExecutionId: filter.workflowExecutionId }),
        ...(filter.nodeId && { nodeId: filter.nodeId }),
        ...(filter.agentId && { agentId: filter.agentId }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  update(id: string, dto: UpdateMessageDto) {
    return this.prisma.message.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.message.delete({ where: { id } });
  }

  saveMessage({
    conversationId,
    workflowExecutionId,
    nodeId,
    agentId,
    content,
    role,
  }) {
    return this.prisma.message.create({
      data: {
        conversationId,
        workflowExecutionId,
        nodeId,
        agentId,
        content,
        role,
      }
    });
  }

  async createAndReply(dto: CreateMessageDto) {
    // 1. 사용자 메시지 저장
    const userMsg = await this.create(dto);

    // 2. 대화방 메시지 히스토리 불러오기
    const messages = await this.findByConversation(dto.conversationId);

    // 3. 에이전트 정보 조회 (agentId로)
    const agent = await this.prisma.agent.findUnique({ where: { id: dto.agentId } });

    // 4. system 메시지 준비 (에이전트 프롬프트/설정)
    const systemMessage = agent?.prompt
      ? { role: 'system' as const, content: agent.prompt }
      : undefined;

    // 5. (선택) RAG context 준비
    let ragMessage;
    if (agent?.ragDocs && agent.ragDocs.length > 0) {
      // 최근 대화 내용을 하나의 쿼리로 합침
      const userQuery = messages.map(m => m.content).join('\n');
      // DocumentService의 RAG API 호출 (예: searchSimilarChunks 또는 answerWithRAG)
      const ragChunks = await this.documentService.searchSimilarChunks(userQuery, 5);
      const contextText = ragChunks.map(c => c.content ?? '').join('\n---\n');
      if (contextText) {
        ragMessage = {
          role: 'system' as const,
          content: `참고 문서:\n${contextText}`,
        };
      }
    }

    // 6. OpenAI 호출
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chatMessages = [
      ...(systemMessage ? [systemMessage] : []),
      ...(ragMessage ? [ragMessage] : []), // RAG가 있으면 추가, 없으면 무시
      ...messages.map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];
    const completion = await openai.chat.completions.create({
      model: agent?.model ?? 'gpt-4o',
      messages: chatMessages,
      temperature: agent?.temperature ?? 0.2,
    });
    const aiMessage = completion.choices[0].message.content ?? 'AI 응답 없음';

    // 7. AI 메시지 저장
    await this.create({
      content: aiMessage,
      role: 'ASSISTANT',
      conversationId: dto.conversationId,
      agentId: dto.agentId,
      nodeId: dto.nodeId,
    });
  }
}