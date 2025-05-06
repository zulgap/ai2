import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET(request: NextRequest, { params }: any) {
  const { id, docId } = params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}/chunks`);
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '청크 조회 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}