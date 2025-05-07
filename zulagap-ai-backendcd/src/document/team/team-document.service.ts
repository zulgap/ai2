import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractTextFromFile } from '../utilles/extractTextFromFile';
import { VectorStoreService } from '../vectorstore/vectorstore.service';

@Injectable()
export class TeamDocumentService {
  constructor(
    private prisma: PrismaService,
    private vectorStoreService: VectorStoreService, // ← 의존성 주입
  ) {}

  // 문서 상세 조회 (청크 포함)
  async findOneByTeam(teamId: string, documentId: string) {
    return this.prisma.document.findFirst({
      where: { id: documentId, teamId },
      include: { chunks: true },
    });
  }

  // 문서 생성 + 텍스트 추출 + 청크/임베딩/벡터스토어 저장
  async createForTeam(teamId: string, data: any, file?: Express.Multer.File) {
    let content = data.content;
    let size = data.size;
    let mimetype = data.mimetype;
    let relations = data.relations;
    let embedding = data.embedding;
    let vectorized = data.vectorized === 'true' || data.vectorized === true;
    let title = data.title;

    // 파일이 있으면 파일 정보로 보정
    if (file) {
      content = content ?? await extractTextFromFile(file);
      size = file.size;
      mimetype = file.mimetype;
      title = title ?? file.originalname;
    }

    // 필수값 체크
    if (!title) throw new Error('title is required');
    if (!size || isNaN(Number(size))) throw new Error('size is required');
    if (!mimetype) throw new Error('mimetype is required');

    // JSON 파싱
    if (typeof relations === 'string') relations = JSON.parse(relations);
    if (typeof embedding === 'string') embedding = JSON.parse(embedding);

    const doc = await this.prisma.document.create({
      data: {
        title,
        teamId,
        size: Number(size),
        mimetype,
        brandId: data.brandId,
        agentId: data.agentId,
        workflowId: data.workflowId,
        nodeId: data.nodeId,
        metadata: data.metadata,
        relations,
        embedding,
        vectorized,
        content,
        isTeamOnly: true,
        isBrandOnly: false,
        isAgentOnly: false,
      },
    });

    if (content) {
      await this.vectorStoreService.processAndStoreTextToVectorStore(content, {
        documentId: doc.id,
        teamId,
        brandId: data.brandId,
      });
    }

    return doc;
  }

  // 문서 삭제
  async removeFromTeam(teamId: string, documentId: string) {
    return this.prisma.document.deleteMany({
      where: { id: documentId, teamId },
    });
  }

  // relations: [{from, to, ...}, ...] 배열 전체를 받아서 저장
  async saveRelations(teamId: string, relations: any[]) {
    if (!Array.isArray(relations)) throw new Error('relations must be array');

    // 수정 대상 문서 id 목록 추출
    const docIds = Array.from(new Set(relations.map(r => r.from)));

    await this.prisma.$transaction(async (tx) => {
      // 1. 해당 문서들의 기존 관계만 삭제
      await tx.documentRelation.deleteMany({
        where: {
          teamId,
          fromId: { in: docIds },
        },
      });

      // 2. 새 관계 일괄 추가 (createMany)
      if (relations.length > 0) {
        const data = relations.map((rel: any) => ({
          fromId: rel.from,
          toId: rel.to,
          teamId,
          brandId: rel.brandId ?? null,
          type: rel.type,
          prompt: rel.prompt,
        }));
        await tx.documentRelation.createMany({ data });
      }

      // 3. relations 필드 동기화
      for (const docId of docIds) {
        const relsForDoc = relations.filter(r => r.from === docId);
        await tx.document.update({
          where: { id: docId, teamId },
          data: { relations: relsForDoc },
        });
      }
    });

    return { success: true };
  }

  // (필요하다면) 팀별 문서의 기타 기능만 이곳에 구현
}