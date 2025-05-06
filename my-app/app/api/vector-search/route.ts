import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function POST(req: NextRequest) {
  try {
    const { query, subjectId, subjectType, chatHistory } = await req.json();
    console.log('[API ROUTE] 백엔드로 전달:', { query, subjectId, subjectType, chatHistory });
    const res = await fetch(`${BACKEND_URL}/api/vector-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, subjectId, subjectType, chatHistory }),
    });
    console.log('[API ROUTE] 백엔드 응답 상태:', res.status);
    const data = await res.json();
    console.log('[API ROUTE] 백엔드 응답 데이터:', data);
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    console.error('[API ROUTE] 백엔드 요청 실패:', e);
    return NextResponse.json({ error: '백엔드 요청 실패', detail: e?.message }, { status: 500 });
  }
}
