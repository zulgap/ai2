import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 팀 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');
  let url = `${BACKEND_URL}/teams`;
  if (brandId) url += `?brandId=${brandId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }
  const data = await res.json();
  // 항상 배열 반환
  return NextResponse.json(Array.isArray(data) ? data : (data.teams || []));
}

// 팀 생성
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: '팀 생성 실패', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: '팀 생성 중 오류', detail: String(e) }, { status: 500 });
  }
}