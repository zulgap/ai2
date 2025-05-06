import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 에이전트 단일 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const res = await fetch(`${BACKEND_URL}/agents/${id}`);
  const data = await res.json();
  return NextResponse.json(data);
}

// 에이전트 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

// 에이전트 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const res = await fetch(`${BACKEND_URL}/agents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '에이전트 삭제 실패', detail: msg }, { status: res.status });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { ok: true };
  }
  return NextResponse.json(data);
}