import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { RagService } from '../rag/rag.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VectorSearchService {
  constructor(private readonly ragService: RagService) {}

  async search({ query, subjectId, subjectType, chatHistory }: any) {
    return await this.ragService.answerWithRAG(
      query,
      subjectId,
      subjectType,
      5,
      chatHistory,
    );
  }
}

export function splitTextToChunks(text: string, chunkSize = 1000, overlap = 100): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function createEmbeddingsForChunks(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: chunks,
  });
  return embeddingRes.data.map((item: any) => item.embedding);
}

@Injectable()
export class VectorStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async saveChunksToVectorStore(
    chunks: string[],
    embeddings: number[][],
    meta: Record<string, any> = {}
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const { documentId } = meta; // 나머지 필드는 사용하지 않음
      await this.prisma.documentChunk.create({
        data: {
          content: chunks[i],
          embedding: embeddings[i],
          chunkIndex: i,
          document: { connect: { id: documentId } },
          agentId: meta.agentId ?? null,
          brandId: meta.brandId ?? null,
          teamId: meta.teamId ?? null,
        },
      });
    }
  }

  async processAndStoreTextToVectorStore(
    text: string,
    meta: Record<string, any> = {}
  ) {
    const chunks = splitTextToChunks(text);
    const embeddings = await createEmbeddingsForChunks(chunks);
    console.log('[임베딩 결과]', embeddings);
    await this.saveChunksToVectorStore(chunks, embeddings, meta);
    return { count: chunks.length };
  }
}
