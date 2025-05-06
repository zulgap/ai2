// filepath: my-app/app/api/brands/[id]/documents/[docId]/regen-chunks/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function POST(request: NextRequest, context: any) {
  const { id, docId } = context.params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}/regen-chunks`, {
    method: 'POST',
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 청크 재생성 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

export async function GET(
  req: NextRequest,
  { params }: any
) {
  const { id, docId } = params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}/regen-chunks`, {
    method: 'GET',
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 청크 조회 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}