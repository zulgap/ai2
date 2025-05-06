import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 에이전트 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  let url = `${BACKEND_URL}/agents`;
  if (teamId) url += `?teamId=${teamId}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[API][GET] 백엔드 응답 에러:', res.status, res.statusText);
      return NextResponse.json({ error: '백엔드 GET 요청 실패', status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : (data.agents || data.data || []));
  } catch (err: any) {
    console.error('[API][GET] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API GET 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}

// 에이전트 생성
export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[API][POST] 백엔드 응답 에러:', res.status, res.statusText, errorData);
      return NextResponse.json({ error: '백엔드 POST 요청 실패', detail: errorData, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[API][POST] 예외 발생:', err?.message || err);
    return NextResponse.json({ error: 'API POST 처리 중 예외 발생', detail: err?.message || err }, { status: 500 });
  }
}