import { NextRequest, NextResponse } from 'next/server';

// 환경변수명 수정: NEXT_PUBLIC_BACKEND_URL 사용
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 특정 팀 문서 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const { docId } = params;
  if (!teamId) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 });
  }
  if (!docId) {
    return NextResponse.json({ error: 'docId required' }, { status: 400 });
  }

  const res = await fetch(`${BACKEND_URL}/teams/${teamId}/documents/${docId}`);
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 조회 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}