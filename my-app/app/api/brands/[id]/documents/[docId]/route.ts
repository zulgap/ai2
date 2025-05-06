import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

export async function GET(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id, docId } = context.params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}`, { method: 'GET' });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id, docId } = context.params;
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ error: '문서 수정 실패', detail: msg }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: '문서 수정 중 오류', detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id, docId } = context.params;
  const res = await fetch(`${BACKEND_URL}/brands/${id}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 삭제 실패', detail: msg }, { status: res.status });
  }
  return new Response(null, { status: 204 });
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  const formData = await req.formData();
  const res = await fetch(`${BACKEND_URL}/brand-documents/${id}`, {
    method: 'POST',
    body: formData,
    // Content-Type 지정하지 마세요!
  });
  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: '문서 업로드 실패', detail: msg }, { status: res.status });
  }
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: 201 });
}