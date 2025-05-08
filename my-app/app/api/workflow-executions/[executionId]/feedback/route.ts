import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 피드백 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const res = await fetch(`${BACKEND_BASE}/feedbacks/execution/${params.executionId}`);
    
    if (!res.ok) {
      // 404인 경우 빈 배열 반환 (API가 아직 구현되지 않았을 수 있음)
      if (res.status === 404) {
        console.log(`백엔드 API가 아직 없음 (404): /feedbacks/execution/${params.executionId}`);
        return NextResponse.json([]);
      }
      
      return NextResponse.json(
        { error: `피드백 조회 실패: ${res.status}` }, 
        { status: 200 } // 클라이언트에서 처리할 수 있게 200으로 반환
      );
    }
    
    const feedbacks = await res.json();
    return NextResponse.json(Array.isArray(feedbacks) ? feedbacks : []);
    
  } catch (error: unknown) {
    console.error("피드백 조회 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json([], { status: 200 });
  }
}

// 피드백 생성 (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const body = await req.json();
    
    const res = await fetch(`${BACKEND_BASE}/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        workflowExecutionId: params.executionId
      })
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `피드백 생성 실패: ${res.status}` }, 
        { status: res.status }
      );
    }
    
    const result = await res.json();
    return NextResponse.json(result);
    
  } catch (error: unknown) {
    console.error("피드백 생성 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}