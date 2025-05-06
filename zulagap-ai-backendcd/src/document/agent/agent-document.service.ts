import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractTextFromFile } from '../utilles/extractTextFromFile';
import { processAndStoreTextToVectorStore } from '../vectorstore/vectorstore.service';

@Injectable()
export class AgentDocumentService {
  constructor(private prisma: PrismaService) {}

  // 문서 상세 조회 (청크 포함)
  async findOneByAgent(agentId: string, documentId: string) {
    return this.prisma.document.findFirst({
      where: { id: documentId, agentId },
      include: { chunks: true },
    });
  }

  // 문서 생성 + 텍스트 추출 + 청크/임베딩/벡터스토어 저장
  async createForAgent(agentId: string, data: any, file?: Express.Multer.File) {
    try {
      let content = data?.content;
      let size = data?.size;
      let mimetype = data?.mimetype;
      let relations = data?.relations;
      let embedding = data?.embedding;
      let vectorized = data?.vectorized === 'true' || data?.vectorized === true;
      let title = data?.title;

      // 파일이 있으면 파일 정보로 보정
      if (file) {
        content = content ?? await extractTextFromFile(file);
        size = file.size;
        mimetype = file.mimetype;
        title = title ?? file.originalname; // ← 수정
      }

      // 필수값 체크
      if (!title) throw new BadRequestException('title is required');
      if (!size || isNaN(Number(size))) throw new BadRequestException('size is required');
      if (!mimetype) throw new BadRequestException('mimetype is required');
      if (!content) throw new BadRequestException('content is required (파일 또는 본문 필요)');

      // JSON 파싱
      if (typeof relations === 'string') relations = JSON.parse(relations);
      if (typeof embedding === 'string') embedding = JSON.parse(embedding);

      const doc = await this.prisma.document.create({
        data: {
          title,
          agentId,
          size: Number(size),
          mimetype,
          brandId: data.brandId,
          teamId: data.teamId,
          workflowId: data.workflowId,
          nodeId: data.nodeId,
          metadata: data.metadata,
          relations,
          embedding,
          vectorized,
          content,
          isTeamOnly: false,
          isBrandOnly: false,
          isAgentOnly: true,
        },
      });

      if (content) {
        await processAndStoreTextToVectorStore(content, {
          documentId: doc.id,
          agentId,
          brandId: data.brandId,
          teamId: data.teamId,
        });
      }

      return doc;
    } catch (e) {
      // NestJS가 에러를 정상적으로 응답하도록
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException(e?.message || e);
    }
  }

  // 문서 삭제
  async removeFromAgent(agentId: string, documentId: string) {
    return this.prisma.document.deleteMany({
      where: { id: documentId, agentId },
    });
  }

  // relations: [{from, to, ...}, ...] 배열 전체를 받아서 저장
  async saveRelations(agentId: string, relations: any[]) {
    if (!Array.isArray(relations)) throw new Error('relations must be array');

    // 1. 기존 관계 삭제 (해당 agent의 모든 관계)
    await this.prisma.documentRelation.deleteMany({
      where: { agentId },
    });

    // 2. 새 관계 추가
    for (const rel of relations) {
      await this.prisma.documentRelation.create({
        data: {
          fromId: rel.from,
          toId: rel.to,
          agentId,
          brandId: rel.brandId ?? null,
          teamId: rel.teamId ?? null,
          type: rel.type,
          prompt: rel.prompt,
        },
      });
    }

    // 3. (선택) 문서의 relations JSON 필드도 동기화
    const docIds = Array.from(new Set(relations.map(r => r.from)));
    for (const docId of docIds) {
      const relsForDoc = relations.filter(r => r.from === docId);
      await this.prisma.document.update({
        where: { id: docId, agentId },
        data: { relations: relsForDoc },
      });
    }

    return { success: true };
  }

  // 문서 목록 조회
  async findAllByAgent(agentId: string) {
    return this.prisma.document.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 에이전트별 RAG 문서 목록
  async getAgentRagDocs(agentId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent?.ragDocs) return [];
    return this.prisma.document.findMany({
      where: { id: { in: agent.ragDocs } },
    });
  }
}