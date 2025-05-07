import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const { workflowId } = params;

  // 워크플로우와 팀, 노드 정보 조회
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      team: { include: { agents: true } },
      nodes: true,
    },
  });

  if (!workflow) return NextResponse.json([], { status: 404 });

  // 팀의 모든 에이전트
  let agents = workflow.team?.agents || [];

  // 노드별 리더 에이전트도 포함 (중복 제거)
  const nodeAgentIds = (workflow.nodes as { leaderAgentId?: string | null }[])
    .map(n => n.leaderAgentId)
    .filter((id): id is string => Boolean(id));
  const nodeAgents = nodeAgentIds.length
    ? await prisma.agent.findMany({ where: { id: { in: nodeAgentIds } } })
    : [];

  // 중복 제거
  const agentMap = new Map();
  [...agents, ...nodeAgents].forEach(a => agentMap.set(a.id, a));
  agents = Array.from(agentMap.values());

  return NextResponse.json(agents);
}

export async function POST(req: NextRequest, { params }: { params: { workflowId: string } }) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { workflowId: string; nodeId: string } }) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}/nodes/${params.nodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { workflowId: string; nodeId: string } }) {
  const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}/nodes/${params.nodeId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}