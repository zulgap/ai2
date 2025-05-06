import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/workflow-executions';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params; // 반드시 await!
  // id는 workflowId 역할
  let body = await req.json();
  if (!body.userId) body.userId = 'guest';
  const res = await fetch(`${BACKEND_URL}/${params.id}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
