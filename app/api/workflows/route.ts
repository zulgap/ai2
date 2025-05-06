import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 워크플로우 생성
export async function POST(request: Request) {
  const { teamId, name, description, userId, teamLeaderType, leaderAgentId, nodes } = await request.json();
  if (!teamId || !name || !userId || !teamLeaderType) {
    return NextResponse.json({ error: '필수값 누락' }, { status: 400 });
  }
  const workflow = await prisma.workflow.create({
    data: {
      teamId,
      name,
      description,
      userId,
      teamLeaderType,
      leaderAgentId,
      nodes: {
        create: nodes.map((node: any) => ({
          name: node.name,
          type: node.type,
          data: node.data ?? {},
          leaderAgentId: node.leaderAgentId,
        })),
      },
    },
    include: { nodes: true },
  });
  return NextResponse.json(workflow);
}

// 워크플로우 목록 조회
export async function GET() {
  const workflows = await prisma.workflow.findMany({
    include: { nodes: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(workflows);
}