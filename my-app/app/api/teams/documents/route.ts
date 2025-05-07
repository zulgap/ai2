import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

// 팀 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) {
      console.error('[문서목록] teamId 누락');
      return NextResponse.json({ error: 'teamId required' }, { status: 400 });
    }

    console.log(`[문서목록] teamId: ${teamId}`);
    const res = await fetch(`${BACKEND_URL}/teams/${teamId}/documents`, { cache: 'no-store' });
    if (!res.ok) {
      const msg = await res.text();
      console.error(`[문서목록] 백엔드 응답 오류: ${msg}`);
      return NextResponse.json({ error: 'Backend error', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[문서목록] 예외:', e);
    return NextResponse.json({ error: 'Internal error', detail: String(e) }, { status: 500 });
  }
}

// 팀 문서 업로드
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  // 관계 저장 요청인지 확인 (body에 relations가 있으면 관계 저장)
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    if (body?.relations && Array.isArray(body.relations)) {
      // 다수의 관계 저장
      if (!teamId && !body.teamId) {
        return NextResponse.json({ error: 'teamId required' }, { status: 400 });
      }
      const realTeamId = teamId || body.teamId;
      const res = await fetch(`${BACKEND_URL}/teams/${realTeamId}/documents/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relations: body.relations }),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
  }

  // 기본: 파일 업로드
  if (!teamId) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 });
  }
  const formData = await request.formData();
  const res = await fetch(`${BACKEND_URL}/teams/${teamId}/documents`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}