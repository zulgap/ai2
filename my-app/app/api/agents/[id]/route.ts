import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/agents';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const res = await fetch(`${BACKEND_URL}/${id}`, {
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