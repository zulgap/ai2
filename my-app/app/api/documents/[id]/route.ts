import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  context: Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const { id } = params;
  const body = await request.json();

  // 실제 백엔드로 PATCH 요청 전달 (문서 수정)
  const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 업데이트 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}