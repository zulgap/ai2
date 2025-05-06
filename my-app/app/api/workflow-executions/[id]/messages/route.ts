import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/workflow-executions';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context; // Next.js 14+에서 params는 await 필요
  // id는 executionId 역할
  const res = await fetch(`${BACKEND_URL}/${params.id}/messages`);
  if (!res.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context; // Next.js 14+에서 params는 await 필요
  // id는 executionId 역할
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/${params.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}