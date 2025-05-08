import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 워크플로우 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: '백엔드 GET 요청 실패', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'API GET 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 워크플로우 수정 (노드 배열 포함)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const body = await req.json();
  // body.nodes: [{ id?, name, type, leaderAgentId, order }]
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: '백엔드 PATCH 요청 실패', detail: errorData, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'API PATCH 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 워크플로우 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: '백엔드 DELETE 요청 실패', status: res.status }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'API DELETE 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { executionId: string } }) {
  const body = await req.json();
  if (!body.nodeId) {
    return NextResponse.json({ error: 'nodeId는 필수입니다.' }, { status: 400 });
  }
  // ...백엔드로 전달...
}