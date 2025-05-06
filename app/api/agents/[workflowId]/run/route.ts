import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjusted path to match Next.js alias convention

export async function POST(request: Request) {
  const { agentId, question } = await request.json();

  // 1. 에이전트 + 팀 + 브랜드 정보 계층적으로 조회
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      team: {
        include: {
          brand: true,
        },
      },
    },
  });

  // 2. 프롬프트 합성
  const brandIdentity = (agent?.team?.brand?.identity as { prompt?: string })?.prompt || "";
  const teamGoal = agent?.team?.description || "";
  const agentRole = agent?.description || "";

  const prompt = `
[브랜드 아이덴티티]
${brandIdentity}

[팀 목표]
${teamGoal}

[에이전트 역할]
${agentRole}

질문: ${question}
`;

  // 3. 프롬프트를 AI API에 전달
  // ...AI 호출 코드...

  return NextResponse.json({ prompt });
}