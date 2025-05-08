import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 노드 목록 조회 (쿼리: workflowId)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get('workflowId');
  const url = workflowId
    ? `${BACKEND_BASE}/nodes?workflowId=${workflowId}`
    : `${BACKEND_BASE}/nodes`;
  const res = await fetch(url, {
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
          // 필요시 기타 필드 추가
        }))
      : [],
    { status: res.status }
  );
}

// 노드 생성 (담당자/순서/타입 포함)
export async function POST(req: NextRequest) {
  const body = await req.json();
  // body: { workflowId, name, type, leaderAgentId, order }
  const res = await fetch(`${BACKEND_BASE}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}