import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AgentRole } from '@prisma/client';
import { OpenAI } from 'openai';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  // userId는 data에 직접 넣지 않고, 반드시 user relation으로 연결!
  async createAgentWithUser(userId: string, data: Omit<Prisma.AgentCreateInput, 'user'>) {
    return this.prisma.agent.create({
      data: {
        ...data,
        user: { connect: { id: userId } }, // 여기서 변환
      },
    });
  }

  // Prisma.AgentCreateInput에는 반드시 user: { connect: { id } } 등 relation 사용!
  async create(data: Prisma.AgentCreateInput) {
    const { userId, teamId, brandId, ...rest } = data as any;
    return this.prisma.agent.create({
      data: {
        ...rest,
        ...(userId !== undefined && userId !== null ? { user: { connect: { id: userId } } } : undefined),
        ...(teamId ? { team: { connect: { id: teamId } } } : undefined),
        ...(brandId ? { brand: { connect: { id: brandId } } } : undefined),
      },
    });
  }

  // 팀별/워크플로우별 에이전트 목록 조회
  async findAll(filter: { teamId?: string; workflowId?: string }) {
    if (filter.workflowId) {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: filter.workflowId },
        include: { agent: true, leaderAgent: true },
      });
      if (!workflow) return [];
      const agents: Array<typeof workflow.agent> = [];
      if (workflow.agent) agents.push(workflow.agent);
      if (workflow.leaderAgent) agents.push(workflow.leaderAgent);
      return agents;
    }
    return this.prisma.agent.findMany({
      where: {
        ...(filter.teamId && { teamId: filter.teamId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<Prisma.AgentUpdateInput>) {
    return this.prisma.agent.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.agent.delete({ where: { id } });
  }

  // AI 채팅 (실제 GPT 연동)
  async chatWithAgent(agentId: string, message: string, context?: any) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });

    const prompt = `
[에이전트 역할]: ${agent?.prompt}
[에이전트 아이덴티티]: ${JSON.stringify(agent?.identity)}
[질문]: ${message}
`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: agent?.model || 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 팀의 AI 에이전트입니다.' },
        { role: 'user', content: prompt },
      ],
      temperature: agent?.temperature ?? 0.2,
    });

    return {
      agentId,
      prompt,
      message,
      response: completion.choices[0].message.content,
    };
  }

  // 자식(하위) 에이전트 조회
  async getChildrenAgents(id: string) {
    return this.prisma.agent.findMany({ where: { parentAgentId: id } });
  }

  // 부모(상위) 에이전트 조회
  async getParentAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id }, include: { parentAgent: true } });
    return agent?.parentAgent;
  }

  // 타입별 에이전트 목록 조회
  async findByType(type: string) {
    return this.prisma.agent.findMany({ where: { type } });
  }

  // 미션/프롬프트/RAG/아이덴티티 조회
  async getMission(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    return {
      prompt: agent?.prompt,
      ragDocs: agent?.ragDocs,
      identity: agent?.identity,
    };
  }

  // 미션/프롬프트/RAG/아이덴티티 수정
  async updateMission(id: string, body: { prompt?: string; ragDocs?: string[]; identity?: any }) {
    return this.prisma.agent.update({
      where: { id },
      data: {
        ...(body.prompt !== undefined && { prompt: body.prompt }),
        ...(body.ragDocs !== undefined && { ragDocs: body.ragDocs }),
        ...(body.identity !== undefined && { identity: body.identity }),
      },
    });
  }

  // 검색/필터
  async searchAgents(query: { teamId?: string; role?: string; type?: string }) {
    return this.prisma.agent.findMany({
      where: {
        ...(query.teamId && { teamId: query.teamId }),
        ...(query.role && { role: { equals: query.role as AgentRole } }),
        ...(query.type && { type: query.type }),
      },
    });
  }

  async addRagDoc(agentId: string, docId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');
    const ragDocs = Array.from(new Set([...(agent.ragDocs || []), docId]));
    return this.prisma.agent.update({
      where: { id: agentId },
      data: { ragDocs },
    });
  }
}

// findAll 사용 예시 (오류 수정)
// 전체 조회: await agentService.findAll({});
// 팀별 조회: await agentService.findAll({ teamId: '팀ID값' });
// 워크플로우별 조회: await agentService.findAll({ workflowId: '워크플로우ID값' });
