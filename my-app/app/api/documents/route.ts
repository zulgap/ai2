import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/documents`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  console.log('[api/documents] 문서 업로드 API 호출');
  const { pathname } = new URL(req.url);

  if (pathname.endsWith('/upload')) {
    const formData = await req.formData();
    console.log('[api/documents] formData keys:', Array.from(formData.keys()));
    const res = await fetch(`${BACKEND_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (pathname.endsWith('/search')) {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/documents/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (pathname.endsWith('/rag')) {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/documents/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // 일반 문서 생성
  const formData = await req.formData();
  console.log('[api/documents] formData keys:', Array.from(formData.keys()));
  const file = formData.get('file');
  const title = formData.get('title');
  const content = formData.get('content') ?? '';
  const relations = formData.get('relations');
  const metadata = formData.get('metadata');

  let relationsParsed = [];
  if (relations) {
    try {
      relationsParsed = JSON.parse(relations as string);
    } catch (e) {
      // 파싱 에러 처리
    }
  }

  let fileContent = '';
  let size = undefined;
  let mimetype = undefined;
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    const buffer = await file.arrayBuffer();
    fileContent = Buffer.from(buffer).toString('base64');
    size = buffer.byteLength;
    mimetype = file.type;
  }

  const body: any = {
    title,
    content,
    size,
    mimetype,
    metadata,
    // 필요시 fileContent, relationsParsed 등도 추가
  };

  // 이후 file, title, content, relationsParsed를 백엔드로 전달
  const res = await fetch(`${BACKEND_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('[api/documents] 백엔드 응답 status:', res.status);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json();
  const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data);
}