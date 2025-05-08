import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

export async function POST(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND_BASE}/workflows/${params.workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: '워크플로우 실행 실패', status: res.status, detail: errorData }, 
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: '워크플로우 실행 중 오류 발생', detail: err?.message || err }, 
      { status: 500 }
    );
  }
}