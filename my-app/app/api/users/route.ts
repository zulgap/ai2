import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/users';

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // /api/users/me
  if (pathname.endsWith('/me')) {
    const res = await fetch(`${BACKEND_URL}/me`, {
      headers: req.headers as any,
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // /api/users/admin-only
  if (pathname.endsWith('/admin-only')) {
    const res = await fetch(`${BACKEND_URL}/admin-only`, {
      headers: req.headers as any,
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // /api/users or /api/users/:id
  const idMatch = pathname.match(/\/users\/([^/]+)$/);
  if (idMatch) {
    const id = idMatch[1];
    const res = await fetch(`${BACKEND_URL}/${id}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // /api/users (전체 목록)
  const res = await fetch(BACKEND_URL, { cache: 'no-store' });
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