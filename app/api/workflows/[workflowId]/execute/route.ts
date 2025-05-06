import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { workflowId: string } }
) {
  const { input, userId } = await request.json();
  const { workflowId } = params;

  // 워크플로우, 노드, 팀장/에이전트 정보 불러오기
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: true, team: true, leaderAgent: true },
  });
  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  // 실행 이력 생성
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId,
      status: 'RUNNING',
      input,
    },
  });

  // 실제 실행 로직은 별도 서비스에서 처리(여기선 실행 이력만 생성)
  return NextResponse.json({ executionId: execution.id });
}