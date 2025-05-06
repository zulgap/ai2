import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Prisma 타입 import
import { Prisma, Agent as AgentModel } from '@prisma/client';
// OpenAI import 수정
import OpenAI from 'openai';

function parseJson(value: any) {
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 팀 서비스와 유사하게 에이전트 생성
  async create(data: any) {
    this.logger.log(`[에이전트 생성] 입력 데이터: ${JSON.stringify(data)}`);
    const {
      documents,
      ragDocs,
      identity,
      docGuides,
      relations,
      userId,
      teamId,
      brandId,
      config,
      ...rest
    } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. 에이전트 DB 생성
      this.logger.log('[에이전트 생성] 1. 에이전트 DB 생성 시작');
      const agent = await tx.agent.create({
        data: {
          ...rest,
          identity: parseJson(identity) ?? {},
          ragDocs: ragDocs ?? [],
          config: config ?? {},
          ...(userId ? { user: { connect: { id: userId } } } : {}),
          ...(teamId ? { team: { connect: { id: teamId } } } : {}),
          ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
          documents: documents && documents.length > 0
            ? { connect: documents.map((id: string) => ({ id })) }
            : undefined,
        },
      });
      this.logger.log(`[에이전트 생성] 1. 에이전트 DB 생성 완료: id=${agent.id}`);

      // 2. 문서 연결 (agentId 업데이트)
      if (documents && documents.length > 0) {
        this.logger.log(`[에이전트 생성] 2. 문서 연결 시작: ${documents.join(',')}`);
        await tx.document.updateMany({
          where: { id: { in: documents } },
          data: { agentId: agent.id },
        });
        this.logger.log('[에이전트 생성] 2. 문서 연결 완료');
      }

      // 3. 문서별 가이드라인(metadata) 반영
      this.logger.log(`[에이전트 생성] 3. 문서별 가이드라인 반영 시작: ${JSON.stringify(docGuides)}`);
      if (docGuides && documents && documents.length > 0) {
        for (const [docId, guide] of Object.entries(docGuides)) {
          this.logger.log(`[에이전트 생성] 3-1. 문서 가이드라인 적용: docId=${docId}, guide=${guide}`);
          if (documents.includes(docId)) {
            const doc = await tx.document.findUnique({ where: { id: docId } });
            if (!doc) {
              this.logger.warn(`[에이전트 생성] 3-2. 문서 없음: ${docId}`);
              continue;
            }
            const prevMeta: Prisma.InputJsonValue = typeof doc?.metadata === 'object' && doc.metadata !== null ? doc.metadata : {};
            const newMeta = JSON.parse(JSON.stringify({ ...(prevMeta as object), guide }));
            await tx.document.update({
              where: { id: docId },
              data: { metadata: newMeta },
            });
            this.logger.log(`[에이전트 생성] 3-3. 문서 가이드라인 저장 완료: docId=${docId}`);
          }
        }
      }

      // 4. 문서 관계 반영 (중복/유효성 체크)
      if (relations && Array.isArray(relations)) {
        this.logger.log(`4. 문서 관계 반영: ${JSON.stringify(relations)}`);
        for (const rel of relations) {
          const fromExists = await tx.document.findUnique({ where: { id: rel.fromId } });
          const toExists = await tx.document.findUnique({ where: { id: rel.toId } });
          if (!fromExists || !toExists) {
            this.logger.warn(`관계 문서 없음: fromId=${rel.fromId}, toId=${rel.toId}`);
            continue;
          }
          if (!agent.id) {
            this.logger.error('agentId is required for DocumentRelation');
            throw new Error('agentId is required for DocumentRelation');
          }
          const exists = await tx.documentRelation.findFirst({
            where: {
              fromId: rel.fromId,
              toId: rel.toId,
              type: rel.type,
              agentId: agent.id,
            },
          });
          if (!exists) {
            await tx.documentRelation.create({
              data: {
                fromId: rel.fromId,
                toId: rel.toId,
                type: rel.type,
                prompt: rel.prompt,
                seq: rel.seq,
                agentId: agent.id,
              },
            });
          }
        }
      }

      this.logger.log(`에이전트 생성 완료: id=${agent.id}`);
      return agent;
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
        ...(query.role && { role: query.role as any }), // as any 또는 enum import
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
