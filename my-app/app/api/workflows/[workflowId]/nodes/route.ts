import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 워크플로우별 노드 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const res = await fetch(`${BACKEND_BASE}/nodes?workflowId=${params.workflowId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  // 담당자/순서/타입 정보 포함 반환
  return NextResponse.json(
    Array.isArray(data)
      ? data.map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
          leaderAgentId: n.leaderAgentId,
          order: n.order,
        }))
      : [],
    { status: res.status }
  );
}

// 노드 생성 (담당자/순서/타입 포함)
export async function POST(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const body = await req.json();
  // body: { name, type, leaderAgentId, order }
  const res = await fetch(`${BACKEND_BASE}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, workflowId: params.workflowId }),
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