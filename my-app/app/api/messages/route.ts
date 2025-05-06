import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/messages';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);

  // /api/messages/conversation/:conversationId 지원
  const conversationIdMatch = pathname.match(/\/messages\/conversation\/([^/]+)/);
  if (conversationIdMatch) {
    const conversationId = conversationIdMatch[1];
    const res = await fetch(`${BACKEND_URL}/conversation/${conversationId}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // 기본 GET (필요시 구현)
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json();
  const res = await fetch(`${BACKEND_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const res = await fetch(`${BACKEND_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data);
}