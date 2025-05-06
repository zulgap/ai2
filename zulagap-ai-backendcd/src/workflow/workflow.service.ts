import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JsonValue } from 'type-fest'; // Add this import for JsonValue
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { TeamLeaderType, MessageRole, AgentRole } from '@prisma/client';
import OpenAI from 'openai';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ConversationService))
    private conversationService: ConversationService,
  ) {}

  async create(dto: CreateWorkflowDto) {
    let name = dto.name;
    if ((!name || name.trim() === '') && dto.teamId) {
      const team = await this.prisma.team.findUnique({ where: { id: dto.teamId } });
      name = team?.name || '워크플로우';
    }

    // === 싱글팀장 워크플로우 노드 검증 ===
    if (dto.teamLeaderType === 'SINGLE' && dto.nodes && dto.nodes.length >= 2) {
      const leaderAgentId = dto.leaderAgentId;
      const firstNode = dto.nodes[0];
      const lastNode = dto.nodes[dto.nodes.length - 1];
      if (
        firstNode.leaderAgentId !== leaderAgentId ||
        lastNode.leaderAgentId !== leaderAgentId
      ) {
        throw new BadRequestException(
          '싱글팀장 워크플로우는 처음과 끝 노드에 팀장 에이전트가 할당되어야 합니다.'
        );
      }
    }

    return this.prisma.workflow.create({
      data: {
        ...dto,
        name,
        nodes: dto.nodes ? { create: dto.nodes } : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.workflow.findMany({
      include: {
        agent: true,
        leaderAgent: true,
        team: true,
        brand: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.workflow.findUnique({
      where: { id },
      include: {
        nodes: {
          include: { leaderAgent: true }
        },
        leaderAgent: true,
        agent: true,
        team: true,
        brand: true,
      },
    });
  }
  
  findByBrand(brandId: string) {
    return this.prisma.workflow.findMany({
      where: { brandId },
      include: {
        agent: true,
        leaderAgent: true,
        team: true,
        brand: true,
      },
    });
  }

  findByTeam(teamId: string) {
    return this.prisma.workflow.findMany({
      where: { teamId },
      include: {
        agent: true,
        leaderAgent: true,
        team: true,
        brand: true,
      },
    });
  }

  update(id: string, dto: UpdateWorkflowDto) {
    const data: any = { ...dto };
    if (data.teamLeaderType && typeof data.teamLeaderType === 'string') {
      data.teamLeaderType = TeamLeaderType[data.teamLeaderType as keyof typeof TeamLeaderType];
    }
    if (data.leaderAgentId === undefined) delete data.leaderAgentId;
    return this.prisma.workflow.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.workflow.delete({ where: { id } });
  }

  // === 워크플로우 실행 예시 ===
  async executeWorkflow(workflowId: string, input: any, conversationId: string, workflowExecutionId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: true,
        leaderAgent: true,
      },
    });
    if (!workflow) throw new Error('Workflow not found');

    // 결과 타입 명시
    const results: {
      nodeId: string;
      agentId: string | null;
      prompt: string;
      output: string | null;
    }[] = [];

    for (const node of workflow.nodes) {
      let agent;
      let prompt: string;
      // mission 안전하게 추출
      let mission = '';
      if (node.data && typeof node.data === 'object' && !Array.isArray(node.data)) {
        mission = (node.data as any).mission || '';
      }

      if (workflow.teamLeaderType === 'SINGLE') {
        agent = workflow.leaderAgent;
        prompt = `[팀장 프롬프트]: ${agent?.prompt}\n[노드 미션]: ${mission}`;
      } else if (workflow.teamLeaderType === 'MULTI' && node.leaderAgentId) {
        agent = await this.prisma.agent.findUnique({ where: { id: node.leaderAgentId } });
        prompt = `[팀장 프롬프트]: ${agent?.prompt}\n[노드 미션]: ${mission}`;
      } else {
        prompt = `[노드 미션]: ${mission}`;
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: agent?.model || 'gpt-4o',
        messages: [
          { role: 'system', content: '당신은 워크플로우 팀장 에이전트입니다.' },
          { role: 'user', content: prompt },
        ],
        temperature: agent?.temperature ?? 0.2,
      });

      results.push({
        nodeId: node.id,
        agentId: agent?.id ?? null,
        prompt,
        output: completion.choices[0].message.content ?? null,
      });

      await this.conversationService.saveMessage({
        conversationId: conversationId,
        nodeId: node.id,
        agentId: agent?.id,
        content: prompt,
        role: MessageRole.ASSISTANT,
        workflowExecutionId, // ← 반드시 포함
      });
    }

    return results;
  }

  async findAgentsByWorkflowId(workflowId: string) {
    // 워크플로우의 노드에 연결된 모든 에이전트(leaderAgent 포함)를 반환
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: {
          include: { leaderAgent: true }
        },
        agent: true,
        leaderAgent: true,
      },
    });

    if (!workflow) return [];

    // 노드별 leaderAgent와 워크플로우의 agent/leaderAgent를 합쳐서 반환
    const agents = [
      ...(workflow.agent ? [workflow.agent] : []),
      ...(workflow.leaderAgent ? [workflow.leaderAgent] : []),
      ...workflow.nodes
        .map(node => node.leaderAgent)
        .filter(a => !!a)
    ];

    // 중복 제거
    const uniqueAgents = Array.from(new Map(agents.map(a => [a.id, a])).values());
    return uniqueAgents;
  }

  async findAgents(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { agent: true, leaderAgent: true },
    });
    const agents: Array<{
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      config: JsonValue;
      isPublic: boolean;
      identity: JsonValue;
      role: AgentRole | null;
      parentAgentId: string | null;
    }> = [];
    if (workflow?.agent) agents.push(workflow.agent);
    if (workflow?.leaderAgent) agents.push(workflow.leaderAgent);
    return agents;
  }
}