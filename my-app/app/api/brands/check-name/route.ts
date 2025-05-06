import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'name 파라미터가 필요합니다.' }, { status: 400 });
    }

    // 실제 백엔드로 중복 체크 요청
    const res = await fetch(`${BACKEND_URL}/brands/check-name?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: '서버 에러', detail: String(err) }, { status: 500 });
  }
}
