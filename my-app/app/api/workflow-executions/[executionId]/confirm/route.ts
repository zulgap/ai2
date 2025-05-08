import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 컨펌 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const res = await fetch(`${BACKEND_BASE}/confirms/execution/${params.executionId}`);
    
    if (!res.ok) {
      // 404인 경우 빈 배열 반환 (API가 아직 구현되지 않았을 수 있음)
      if (res.status === 404) {
        return NextResponse.json([]);
      }
      
      return NextResponse.json(
        { error: `컨펌 조회 실패: ${res.status}` }, 
        { status: res.status }
      );
    }
    
    const confirms = await res.json();
    return NextResponse.json(Array.isArray(confirms) ? confirms : []);
    
  } catch (error: unknown) {
    console.error("컨펌 조회 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json([], { status: 200 }); // 오류 시에도 빈 배열 반환 (UI 에러 방지)
  }
}

// 컨펌 생성 (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const body = await req.json();
    
    // 컨펌 생성 API 호출
    const res = await fetch(`${BACKEND_BASE}/confirms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        workflowExecutionId: params.executionId
      }),
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `컨펌 생성 실패: ${res.status}` }, 
        { status: res.status }
      );
    }
    
    const result = await res.json();
    return NextResponse.json(result);
    
  } catch (error: unknown) {
    console.error("컨펌 생성 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 컨펌 수정 (PATCH)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  const body = await req.json();
  const { id, ...updateData } = body;
  const res = await fetch(`${BACKEND_BASE}/confirms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}