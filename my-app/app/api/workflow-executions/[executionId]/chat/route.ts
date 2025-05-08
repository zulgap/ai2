// 이렇게 수정 (문자열이 아닌 식으로 작성된 것 같습니다)
console.log('API 라우트 파일 로드됨: workflow-executions/[executionId]/chat');

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';

// 메시지 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const res = await fetch(`${BACKEND_BASE}/messages/execution/${params.executionId}`);
    
    if (!res.ok) {
      // 404인 경우 빈 배열 반환 (API가 아직 구현되지 않았을 수 있음)
      if (res.status === 404) {
        console.log(`백엔드 API가 아직 없음 (404): /messages/execution/${params.executionId}`);
        return NextResponse.json([
          { 
            role: 'SYSTEM', 
            content: '채팅 이력이 없거나 API가 준비되지 않았습니다.', 
            timestamp: new Date().toISOString() 
          }
        ]);
      }
      
      return NextResponse.json(
        { error: `채팅 메시지 조회 실패: ${res.status}` }, 
        { status: 200 } // 클라이언트에서 처리할 수 있도록 200으로 반환
      );
    }
    
    const messages = await res.json();
    return NextResponse.json(Array.isArray(messages) ? messages : []);
    
  } catch (error: unknown) {
    console.error("워크플로우 채팅 조회 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json([
      { role: 'SYSTEM', content: `오류: ${errorMessage}`, timestamp: new Date().toISOString() }
    ], { status: 200 });
  }
}

// 메시지 생성 (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const body = await req.json();
    
    // 백엔드 API 호출
    const res = await fetch(`${BACKEND_BASE}/messages/execution/${params.executionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: body.content,
        role: body.role || 'USER', // 롤이 없으면 기본값으로 USER 사용
        nodeId: body.nodeId,
        agentId: body.agentId
      })
    });
    
    if (!res.ok) {
      console.error(`메시지 저장 실패: ${res.status}`);
      return NextResponse.json(
        { error: `메시지 저장 실패: ${res.status}` }, 
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    console.error("메시지 저장 오류:", error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}