import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import { RagService } from '../rag/rag.service';

@Injectable()
export class VectorSearchService {
  constructor(private readonly ragService: RagService) {}

  async search({ query, subjectId, subjectType, chatHistory }: any) {
    // 실제 RAG 기반 답변 생성
    return await this.ragService.answerWithRAG(
      query,
      subjectId,
      subjectType,
      5, // topK
      chatHistory,
    );
  }
}

/**
 * 텍스트를 일정 크기의 청크로 분할
 */
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

/**
 * 청크 배열을 OpenAI API로 임베딩 생성
 */
export async function createEmbeddingsForChunks(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: chunks,
  });
  return embeddingRes.data.map((item: any) => item.embedding);
}

/**
 * 청크와 임베딩을 벡터스토어(DB/외부 API)에 저장
 * 실제 구현은 DB insert 또는 외부 벡터스토어 API 호출로 대체
 */
export async function saveChunksToVectorStore(
  chunks: string[],
  embeddings: number[][],
  meta: Record<string, any> = {}
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    // 실제 구현: DB 저장 또는 외부 API 호출
    // 예시: await db.vectorChunk.create({ content: chunks[i], embedding: embeddings[i], ...meta });
    // 또는 await fetch('https://your-vector-store', { ... });
    // 현재는 로그만 출력
    console.log(`[saveChunksToVectorStore] 저장: 청크${i}, 임베딩 길이: ${embeddings[i]?.length}, 메타:`, meta);
  }
}

/**
 * 전체 파이프라인: 텍스트 → 청크 → 임베딩 → 벡터스토어 저장
 */
export async function processAndStoreTextToVectorStore(
  text: string,
  meta: Record<string, any> = {}
) {
  const chunks = splitTextToChunks(text);
  const embeddings = await createEmbeddingsForChunks(chunks);
  await saveChunksToVectorStore(chunks, embeddings, meta);
  return { count: chunks.length };
}