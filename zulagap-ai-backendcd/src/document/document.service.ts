import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { extractTextFromFile } from './utilles/extractTextFromFile';
import { splitTextToChunks, createEmbeddingsForChunks } from './vectorstore/vectorstore.service';
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        title: dto.title,
        content: dto.content,
        size: dto.size,
        mimetype: dto.mimetype,
        teamId: dto.teamId,
        brandId: dto.brandId,
        userId: dto.userId,
        workflowId: dto.workflowId,
        metadata: dto.metadata ?? Prisma.DbNull, // null 대신 Prisma.DbNull
        relations: dto.relations,
        embedding: dto.embedding,
        agentId: dto.agentId,
        source: dto.source,
      },
    });
  }

  findAll() {
    return this.prisma.document.findMany();
  }

  findOne(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async findOneWithRelations(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) return null;
    const relations = await this.prisma.documentRelation.findMany({
      where: {
        OR: [{ fromId: id }, { toId: id }],
      },
    });
    return { ...document, relations };
  }

  update(id: string, dto: UpdateDocumentDto) {
    return this.prisma.document.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }

  async handleUpload(file: Express.Multer.File, body: any) {
    if (!body.title) {
      throw new BadRequestException('title is required');
    }
    const content = await extractTextFromFile(file);
    const doc = await this.prisma.document.create({
      data: {
        title: body.title,
        content,
        size: file.size,
        mimetype: file.mimetype,
        metadata: body.metadata ? JSON.parse(body.metadata) : {},
        brandId: body.brandId,
      },
    });
    // 문서 저장 후 청크/임베딩 자동 생성
    await this.regenChunks(doc.id);
    return doc;
  }

  async getDocumentsWithRelations(ids: string[]) {
    return this.prisma.document.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        content: true,
        relations: true,
        metadata: true,
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

  async searchSimilarChunks(query: string, topK = 5) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      throw new Error('OPENAI_VECTOR_STORE_ID is not defined in the environment variables.');
    }

    // 1. 쿼리 임베딩 생성
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. 벡터스토어에서 유사 벡터 검색
    const searchRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: topK,
        include_metadata: true,
      }),
    });
    const searchData = await searchRes.json();
    return searchData.data;
  }

  async answerWithRAG(query: string, brandId: string, topK = 5) {
    // 1. 유사 chunk 검색
    const similarChunks = await this.searchSimilarChunks(query, topK);

    // 2. chunk 텍스트 합치기
    const context = similarChunks.map((c: any) => c.content || c.text || '').join('\n---\n');

    // 3. 브랜드의 가이드라인/관계 등 메타데이터 불러오기
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    // identity가 JSON 형태라면 아래처럼 파싱
    let guideLine = '';
    let relations = '';
    if (brand?.identity) {
      try {
        const identity = typeof brand.identity === 'string'
          ? JSON.parse(brand.identity)
          : brand.identity;
        guideLine = identity.guideLine || '';
        relations = identity.relations || '';
      } catch {
        // 파싱 실패시 무시
      }
    }

    // 4. 프롬프트 생성
    const prompt = `
[가이드라인]
${guideLine}

[관계 정보]
${relations}

[문서 내용]
${context}

질문: ${query}
위의 가이드라인과 관계를 반드시 참고해서 답변하세요.
`;

    // 5. GPT 답변 생성
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 문서 기반 AI 비서입니다.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    return {
      answer: completion.choices[0].message.content,
      context: similarChunks,
    };
  }

  async getChunksStatus(documentId: string) {
    return this.prisma.documentChunk.findMany({
      where: { documentId },
      select: {
        id: true,
        chunkIndex: true,
        embedding: true,
        content: true,
        createdAt: true,
      },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  async regenChunks(documentId: string) {
    // 1. 해당 문서 불러오기
    const doc = await this.findOne(documentId);
    if (!doc) throw new Error('문서를 찾을 수 없습니다.');

    // 2. 기존 청크/임베딩 삭제 (필요시)
    await this.prisma.documentChunk.deleteMany({ where: { documentId } });

    // 3. 청크 분할 및 임베딩 생성 재실행
    const text = doc.content;
    const chunks = splitTextToChunks(text);
    const embeddings = await createEmbeddingsForChunks(chunks);

    for (let i = 0; i < chunks.length; i++) {
      await this.prisma.documentChunk.create({
        data: {
          documentId: doc.id,
          content: chunks[i],
          embedding: embeddings[i],
          chunkIndex: i,
        },
      });
    }

    // (벡터스토어 업서트 등 추가 필요시 여기에...)

    const avgEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );
    await this.prisma.document.update({
      where: { id: doc.id },
      data: {
        embedding: avgEmbedding,
        vectorized: true, // ← 벡터스토리 완료 표시
      },
    });

    return { success: true };
  }

  async findOneWithRagDocs(id: string) {
    return this.prisma.brand.findUnique({
      where: { id },
      include: {
        documents: true, // OK!
      },
    });
    // ragDocs는 반환값의 brand.ragDocs로 접근
  }
}