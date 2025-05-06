import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

// 문서 업로드 프록시
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    console.log('[문서업로드][brands/[id]/documents/route.ts] 요청 도착:', { id });
    const formData = await req.formData();
    console.log('[문서업로드][brands/[id]/documents/route.ts] formData keys:', Array.from(formData.keys()));

    // 반드시 백엔드의 brand-documents로 프록시
    const uploadUrl = `${BACKEND_URL}/brand-documents/${id}`;
    console.log('[문서업로드][brands/[id]/documents/route.ts] 백엔드 업로드 URL:', uploadUrl);

    // 올바른 예시
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // headers: 생략!
    });

    let data;
    let text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.error('[문서업로드][brands/[id]/documents/route.ts] 백엔드 응답 오류:', data);
      return NextResponse.json({ error: '문서 업로드 실패', detail: data }, { status: res.status });
    }

    console.log('[문서업로드][brands/[id]/documents/route.ts] 업로드 성공:', data);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[문서업로드][brands/[id]/documents/route.ts] 예외 발생:', e);
    return NextResponse.json({ error: '문서 업로드 중 예외', detail: String(e) }, { status: 500 });
  }
}