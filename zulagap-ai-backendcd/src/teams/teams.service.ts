import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extractTextFromFile } from '../document/utilles/extractTextFromFile';
import { DocumentService } from '../document/document.service'; // ← 추가
import { VectorStoreService } from '../document/vectorstore/vectorstore.service';

function parseJson(value: any) {
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
}

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.team.create({ data });
  }

  async findAll() {
    return this.prisma.team.findMany({
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByBrand(brandId: string) {
    return this.prisma.team.findMany({
      where: { brandId },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
      include: { documents: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.team.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.team.delete({
      where: { id },
    });
  }

  // 팀별 문서 "목록"만 조회
  async getDocuments(teamId: string) {
    return this.prisma.document.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 팀별 에이전트/워크플로우 목록 등은 그대로 유지
  async getAgents(teamId: string) {
    return [];
  }
  async getWorkflows(teamId: string) {
    return [];
  }
}

@Injectable()
export class TeamDocumentService {
  constructor(
    private prisma: PrismaService,
    private documentService: DocumentService, // ← 타입 명확히!
    private vectorStoreService: VectorStoreService // ← 추가
  ) {}

  async findAllByTeam(teamId: string) {
    return this.prisma.document.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByTeam(teamId: string, documentId: string) {
    return this.prisma.document.findFirst({
      where: { id: documentId, teamId },
    });
  }

  async createForTeam(teamId: string, data: any) {
    const { file, title, content, metadata, source, relations, embedding } = data;
    if (!file || !title) {
      throw new Error('file 또는 title이 없습니다.');
    }

    // 1. 파일에서 텍스트 추출 (content가 없으면)
    let docContent = content ?? '';
    if (!docContent && file) {
      try {
        docContent = await extractTextFromFile(file);
      } catch (e) {
        console.warn('[TeamDocumentService] 파일 텍스트 추출 실패:', e);
      }
    }

    // 2. 문서 저장
    const document = await this.prisma.document.create({
      data: {
        title,
        content: docContent,
        teamId,
        size: file.size,
        mimetype: file.mimetype,
        source: source ?? undefined,
        metadata: parseJson(metadata),
        relations: parseJson(relations),
        embedding: parseJson(embedding),
        isTeamOnly: true,
        isBrandOnly: false,
        isAgentOnly: false,
      },
    });

    // 3. 청크/임베딩/벡터스토어 저장
    if (docContent) {
      await this.vectorStoreService.processAndStoreTextToVectorStore(docContent, {
        documentId: document.id,
        teamId,
        title,
      });
    }

    // 4. 문서 저장 후 청크 재생성 (DB 저장)
    if (this.documentService?.regenChunks) {
      await this.documentService.regenChunks(document.id);
    }

    return document;
  }

  async removeFromTeam(teamId: string, documentId: string) {
    return this.prisma.document.deleteMany({
      where: { id: documentId, teamId },
    });
  }
}

@Injectable()
export class TeamRagService {
  private readonly logger = new Logger(TeamRagService.name);

  constructor(private prisma: PrismaService) {}

  async answerWithRAG(
    query: string,
    teamId: string,
    subjectType: 'team',
    topK = 5,
    chatHistory?: { role: string; content: string }[]
  ) {
    // 팀, 문서, 문서관계, 청크 모두 teamId 기준으로 조회
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        documents: {
          include: { chunks: true }
        }
      }
    });
    if (!team) throw new Error('팀을 찾을 수 없습니다.');
    const teamName = team.name || '';
    const teamMission = team.description || '';
    const ragDocs = team.ragDocs || [];
    const documents = team.documents || [];
    const docChunks = documents.flatMap(doc => doc.chunks || []);
    const docRelations = await this.prisma.documentRelation.findMany({
      where: { teamId }
    });

    // 이하 프롬프트 생성, 벡터스토어 검색, GPT 호출 등은 브랜드와 동일하게 재사용
    // ...
  }
}