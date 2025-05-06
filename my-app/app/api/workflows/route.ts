import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/workflows';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get('brandId');
  let url = BACKEND_URL;
  if (brandId) {
    url += `?brandId=${encodeURIComponent(brandId)}`;
  }
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  const workflows = Array.isArray(data) ? data : [];
  const workflowsWithName = workflows.map(wf => ({
    ...wf,
    name: wf.name && wf.name.trim() !== '' ? wf.name : wf.team?.name || '(이름없음)',
  }));
  return NextResponse.json(workflowsWithName);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // === 싱글팀장 워크플로우 노드 검증 ===
  if (body.teamLeaderType === 'SINGLE' && Array.isArray(body.nodes) && body.nodes.length >= 2) {
    const leaderAgentId = body.leaderAgentId;
    const firstNode = body.nodes[0];
    const lastNode = body.nodes[body.nodes.length - 1];
    if (
      firstNode.leaderAgentId !== leaderAgentId ||
      lastNode.leaderAgentId !== leaderAgentId
    ) {
      return NextResponse.json(
        { error: '싱글팀장 워크플로우는 처음과 끝 노드에 팀장 에이전트가 할당되어야 합니다.' },
        { status: 400 }
      );
    }
  }

  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json();
  const res = await fetch(`${BACKEND_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const res = await fetch(`${BACKEND_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data);
}