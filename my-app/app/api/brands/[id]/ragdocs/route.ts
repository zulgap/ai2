import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

// 브랜드의 ragDocs 조회
export async function GET(request: NextRequest, { params }: any) {
  const { id } = params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/ragdocs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: 'ragDocs 조회 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

// ragDocs 수정(문서 ID 배열로 업데이트)
export async function PATCH(request: NextRequest, { params }: any) {
  const { id } = params;
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/brands/${id}/ragdocs`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: 'ragDocs 수정 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}