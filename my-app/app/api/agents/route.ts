import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/agents';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.search;
  const res = await fetch(BACKEND_URL + query, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}

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

// PATCH (에이전트 수정)
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

// DELETE (에이전트 삭제)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const res = await fetch(`${BACKEND_URL}/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data);
}