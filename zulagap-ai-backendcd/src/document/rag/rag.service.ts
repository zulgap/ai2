import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private prisma: PrismaService) {}

  // 유사 청크 검색 (브랜드/팀/에이전트 등 주체별로 확장 가능)
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

  // RAG 답변 생성 (브랜드/팀/에이전트 등 주체별로 확장 가능)
  async answerWithRAG(
    query: string,
    subjectId: string,
    subjectType: 'brand' | 'team' | 'agent',
    topK = 5,
    chatHistory?: { role: string; content: string }[]
  ) {
    this.logger.log(`[SERVICE] answerWithRAG 시작: query=${query}, subjectId=${subjectId}, subjectType=${subjectType}`);
    let ragDocs: string[] = [];
    let guideLine = '';
    let relations = '';
    let brandName = '';
    let brandMission = '';
    let embeddings: number[][] = [];
    let documents: any[] = [];
    let docRelations: any[] = [];
    let docChunks: any[] = [];
    try {
      // 1. 브랜드, 문서, 문서관계, 다큐먼트청크 모두 조회
      if (subjectType === 'brand') {
        this.logger.log(`[SERVICE] 브랜드/문서/관계/청크 정보 조회: id=${subjectId}`);
        const brand = await this.prisma.brand.findUnique({
          where: { id: subjectId },
          include: {
            documents: {
              include: {
                chunks: true // DocumentChunk와 relation
              }
            }
          }
        });
        if (!brand) throw new Error('브랜드를 찾을 수 없습니다.');
        brandName = brand.name || '';
        brandMission = brand.identity
          ? (typeof brand.identity === 'string'
              ? brand.identity
              : JSON.stringify(brand.identity, null, 2))
          : '';
        ragDocs = brand.ragDocs || [];
        documents = brand.documents || [];
        // 모든 문서의 청크를 합침
        docChunks = documents.flatMap(doc => doc.chunks || []);
        // 문서관계(예: DocumentRelation) 조회
        docRelations = await this.prisma.documentRelation.findMany({
          where: { brandId: subjectId }
        });
        if (brand.identity) {
          try {
            const identity = typeof brand.identity === 'string' ? JSON.parse(brand.identity) : brand.identity;
            guideLine = identity.guideLine || '';
            relations = identity.relations || '';
          } catch (e) {
            this.logger.warn(`[SERVICE] 브랜드 identity 파싱 실패: ${e?.message || e}`);
          }
        }
      }

      // 2. 벡터스토어에서 유사 청크 검색 및 임베딩 추출
      this.logger.log(`[SERVICE] OpenAI 임베딩 생성 요청`);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
      if (!vectorStoreId) throw new Error('OPENAI_VECTOR_STORE_ID is not defined');
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });
      const queryEmbedding = embeddingRes.data[0].embedding;
      this.logger.log(`[SERVICE] 임베딩 생성 완료, 벡터스토어 검색 요청`);
      const searchRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          top_k: topK * 2,
          include_metadata: true,
        }),
      });
      let similarChunks = (await searchRes.json()).data || [];
      this.logger.log(`[SERVICE] 벡터스토어 검색 결과 chunks: ${similarChunks.length}`);

      // ragDocs 필터링
      if (ragDocs.length > 0) {
        similarChunks = similarChunks.filter((chunk: any) =>
          ragDocs.includes(chunk.document_id)
        );
        similarChunks = similarChunks.slice(0, topK);
        this.logger.log(`[SERVICE] ragDocs 필터링 후 chunks: ${similarChunks.length}`);
      } else {
        similarChunks = similarChunks.slice(0, topK);
      }

      // 임베딩 정보 추출 (각 청크의 embedding 필드가 있다고 가정)
      embeddings = similarChunks.map((c: any) => c.embedding || []);

      // 3. 프롬프트 생성
      const context = similarChunks.map((c: any) => c.content || c.text || '').join('\n---\n');
      let chatPrompt = '';
      if (chatHistory && Array.isArray(chatHistory)) {
        chatPrompt = chatHistory.map(msg => `[${msg.role}] ${msg.content}`).join('\n');
      }

      // 문서 요약
      const docsSummary = documents.map(doc =>
        `문서ID: ${doc.id}\n제목: ${doc.title}\n내용: ${(doc.content || '').slice(0, 200)}...`
      ).join('\n---\n');

      // 문서관계 요약
      const docRelationsSummary = docRelations.map(rel =>
        `관계ID: ${rel.id} | from: ${rel.fromId} → to: ${rel.toId} | type: ${rel.type}`
      ).join('\n');

      // 다큐먼트청크 요약
      const docChunksSummary = docChunks.map(chunk =>
        `청크ID: ${chunk.id}\n문서ID: ${chunk.documentId}\n내용: ${(chunk.content || '').slice(0, 100)}...`
      ).join('\n---\n');

      const prompt = `
${chatPrompt ? `[이전 대화]\n${chatPrompt}\n` : ''}
[브랜드명]
${brandName}

[브랜드 미션]
${brandMission}

[가이드라인]
${guideLine}

[관계 정보]
${typeof relations === 'string' ? relations : JSON.stringify(relations, null, 2)}

[문서 요약]
${docsSummary}

[문서 관계]
${docRelationsSummary}

[문서 청크 요약]
${docChunksSummary}

[참고 문서 ID]
${ragDocs.join(', ')}

[문서 내용]
${context}

[문서 임베딩 정보]
${JSON.stringify(embeddings, null, 2)}

질문: ${query}
위의 브랜드, 문서, 문서관계, 청크, 임베딩 등 모든 정보를 반드시 참고해서 답변하세요.
`;

      this.logger.log(`[SERVICE] 최종 프롬프트 생성 완료`);

      // 4. GPT 답변 생성
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: '당신은 문서 기반 AI 비서입니다.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });
      this.logger.log(`[SERVICE] GPT 응답 완료`);
      return {
        answer: completion.choices[0].message.content,
        context: similarChunks,
        ragDocs,
        guideLine,
        relations,
        brandName,
        brandMission,
        embeddings,
        documents,
        docRelations,
        docChunks,
      };
    } catch (e) {
      this.logger.error(`[SERVICE] answerWithRAG 오류: ${e?.message || e}`);
      throw e;
    }
  }

  async brandRagSearch(query: string, brandId: string, topK = 5) {
    // 1. 브랜드 정보 및 ragDocs, 관계, 메타데이터(가이드라인) 불러오기
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { documents: true },
    });
    if (!brand) throw new Error('브랜드를 찾을 수 없습니다.');

    const ragDocs = brand.ragDocs || [];
    let guideLine = '';
    let relations = '';
    if (brand.identity) {
      try {
        const identity = typeof brand.identity === 'string'
          ? JSON.parse(brand.identity)
          : brand.identity;
        guideLine = identity.guideLine || '';
        relations = identity.relations || '';
      } catch {}
    }

    // 2. 쿼리 임베딩 및 벡터스토어 검색
    const openai = new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY });
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    const searchRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: topK * 2,
        include_metadata: true,
      }),
    });
    let similarChunks = (await searchRes.json()).data || [];

    // ragDocs 필터링
    if (ragDocs.length > 0) {
      similarChunks = similarChunks.filter((chunk: any) =>
        ragDocs.includes(chunk.document_id)
      );
      similarChunks = similarChunks.slice(0, topK);
    } else {
      similarChunks = similarChunks.slice(0, topK);
    }

    // 3. 프롬프트 생성 및 답변
    const context = similarChunks.map((c: any) => c.content || c.text || '').join('\n---\n');
    const prompt = `
[가이드라인]
${guideLine}

[관계 정보]
${JSON.stringify(relations, null, 2)}

[문서 내용]
${context}

질문: ${query}
위의 가이드라인과 관계를 반드시 참고해서 답변하세요.
`;

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
      ragDocs,
      relations,
      guideLine,
    };
  }
}