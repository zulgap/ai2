import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAIEmbeddings } from "@langchain/openai";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const teamId = searchParams.get('teamId');
  const brandId = searchParams.get('brandId');
  const query = searchParams.get('query');
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

  // 1. 문서 계층적으로 불러오기
  let docs: any[] = [];
  if (agentId) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        documents: true,
        team: {
          include: {
            documents: true,
            brand: { include: { documents: true } },
          },
        },
      },
    });
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    docs = [
      ...(agent.documents ?? []),
      ...(agent.team?.documents ?? []),
      ...(agent.team?.brand?.documents ?? []),
    ];
  } else if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        documents: true,
        brand: { include: { documents: true } },
      },
    });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    docs = [
      ...(team.documents ?? []),
      ...(team.brand?.documents ?? []),
    ];
  } else if (brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { documents: true },
    });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    docs = brand.documents ?? [];
  } else {
    return NextResponse.json({ error: 'No id provided' }, { status: 400 });
  }

  // 2. 임베딩이 있는 문서만 필터
  const docsWithEmbedding = docs.filter(doc => Array.isArray(doc.embedding));

  if (docsWithEmbedding.length === 0) {
    return NextResponse.json([]);
  }

  // 3. 쿼리 임베딩 생성
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  const queryEmbedding = await embeddings.embedQuery(query);

  // 4. 코사인 유사도 계산
  function cosineSim(a: number[], b: number[]) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  // 5. 유사도 순 정렬 후 상위 5개 반환
  const results = docsWithEmbedding
    .map(doc => ({
      ...doc,
      score: cosineSim(queryEmbedding, doc.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json(results);
}