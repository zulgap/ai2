import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

export async function POST(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}