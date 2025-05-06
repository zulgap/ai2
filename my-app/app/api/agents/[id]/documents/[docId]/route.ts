import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 특정 에이전트의 특정 문서 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const { id, docId } = params;
  const res = await fetch(`${BACKEND_URL}/agents/${id}/documents/${docId}`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}

// 특정 에이전트의 특정 문서 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const { id, docId } = params;
  const res = await fetch(`${BACKEND_URL}/agents/${id}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 삭제 실패', detail: msg }, { status: res.status });
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { ok: true };
  }
  return NextResponse.json(data);
}