import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/workflow-executions';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context; // Next.js 14+에서 params는 await 필요
  // id는 executionId 역할
  const res = await fetch(`${BACKEND_URL}/${params.id}`);
  if (!res.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params; // Next.js 14+에서 params는 await 필요
  // id는 workflowId 역할
  let body = await req.json();
  if (!body.userId) {
    body.userId = 'guest';
  }
  const res = await fetch(`${BACKEND_URL}/${params.id}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context; // Next.js 14+에서 params는 await 필요
  // id는 executionId 역할
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = await context; // Next.js 14+에서 params는 await 필요
  // id는 executionId 역할
  const res = await fetch(`${BACKEND_URL}/${params.id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Delete failed' }, { status: res.status });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}