import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractTextFromFile } from '../utilles/extractTextFromFile';
import { VectorStoreService } from '../vectorstore/vectorstore.service';

@Injectable()
export class AgentDocumentService {
  constructor(
    private prisma: PrismaService,
    private vectorStoreService: VectorStoreService, // ← 의존성 주입
  ) {}

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
      let metadata = data?.metadata;

      // 에이전트 특성: metadata 파싱 및 보정
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = { guide: metadata };
        }
      }

      // 파일이 있으면 파일 정보로 보정
      if (file) {
        content = content ?? await extractTextFromFile(file);
        size = file.size;
        mimetype = file.mimetype;
        title = title ?? file.originalname;
      }

      // 필수값 체크 (에이전트 특성: agentId 필수)
      if (!title) throw new BadRequestException('title is required');
      if (!size || isNaN(Number(size))) throw new BadRequestException('size is required');
      if (!mimetype) throw new BadRequestException('mimetype is required');
      if (!content) throw new BadRequestException('content is required (파일 또는 본문 필요)');
      if (!agentId) throw new BadRequestException('agentId is required');

      // JSON 파싱
      if (typeof relations === 'string') relations = JSON.parse(relations);

      // JSON 파싱 및 로그 추가
      console.log('[임베딩 원본]', data.embedding);
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
          console.log('[임베딩 파싱 성공]', embedding);
        } catch (e) {
          console.error('[임베딩 파싱 실패]', e);
          embedding = undefined;
        }
      } else {
        console.log('[임베딩 파싱 불필요]', embedding);
      }

      // 에이전트 특성: isAgentOnly true, isTeamOnly/BrandOnly false
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
          metadata,
          relations,
          embedding,
          vectorized,
          content,
          isTeamOnly: false,
          isBrandOnly: false,
          isAgentOnly: true,
        },
      });

      // 벡터스토어 저장 (청크/임베딩)
      if (content) {
        await this.vectorStoreService.processAndStoreTextToVectorStore(content, {
          documentId: doc.id,
          agentId,
          brandId: data.brandId,
          teamId: data.teamId,
        });
      }

      return doc;
    } catch (e) {
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

    // 수정 대상 문서 id 목록 추출
    const docIds = Array.from(new Set(relations.map(r => r.from)));

    await this.prisma.$transaction(async (tx) => {
      // 1. 해당 문서들의 기존 관계만 삭제
      await tx.documentRelation.deleteMany({
        where: {
          agentId,
          fromId: { in: docIds },
        },
      });

      // 2. 새 관계 일괄 추가 (createMany)
      if (relations.length > 0) {
        const data = relations.map((rel: any) => ({
          fromId: rel.from,
          toId: rel.to,
          agentId,
          brandId: rel.brandId ?? null,
          teamId: rel.teamId ?? null,
          type: rel.type,
          prompt: rel.prompt,
        }));
        await tx.documentRelation.createMany({ data });
      }

      // 3. 문서의 relations JSON 필드 동기화
      for (const docId of docIds) {
        const relsForDoc = relations.filter(r => r.from === docId);
        await tx.document.update({
          where: { id: docId, agentId },
          data: { relations: relsForDoc },
        });
      }
    });

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