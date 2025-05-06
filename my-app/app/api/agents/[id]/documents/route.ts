import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 에이전트 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    if (!agentId) {
      console.error('[에이전트문서목록] agentId 누락');
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    console.log(`[에이전트문서목록] agentId: ${agentId}`);
    const res = await fetch(`${BACKEND_URL}/agents/${agentId}/documents`, { cache: 'no-store' });
    if (!res.ok) {
      const msg = await res.text();
      console.error(`[에이전트문서목록] 백엔드 응답 오류: ${msg}`);
      return NextResponse.json({ error: 'Backend error', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[에이전트문서목록] 예외:', e);
    return NextResponse.json({ error: 'Internal error', detail: String(e) }, { status: 500 });
  }
}

// 에이전트 문서 업로드
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }
  const formData = await request.formData();
  const res = await fetch(`${BACKEND_URL}/agents/${agentId}/documents`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}