import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgentExecutor } from '@/lib/agent/agent-executor';

// agent의 타입을 명확히 지정
type Agent = {
  id: string;
  name: string;
  team?: { id: string; name: string };
  systemPrompt?: string;
  config?: any; // config 추가
  // 필요한 속성 추가
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id;
    const { message, sessionId, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 에이전트 + 팀 정보 함께 조회 (config도 포함)
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { team: true }
    }) as Agent;

    if (!agent) {
      return NextResponse.json(
        { error: '에이전트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 관리
    let session: any;
    if (sessionId) {
      session = await prisma.conversation.findUnique({
        where: { id: sessionId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } }
        }
      });
      if (!session) {
        return NextResponse.json(
          { error: '세션을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else {
      // 새 세션 생성 (teamId는 Prisma 스키마에 따라 제거)
      session = await prisma.conversation.create({
        data: {
          title: `${agent.team?.name || agent.name} 대화`,
          userId: userId || 'anonymous',
          agentId
          // teamId: agent.team?.id || null // teamId 필드가 없다면 제거
        },
        include: {
          messages: { orderBy: { createdAt: 'asc' } }
        }
      });

      // 시스템 메시지 추가 (있는 경우)
      if (agent.systemPrompt) {
        await prisma.message.create({
          data: {
            conversationId: session.id,
            role: 'SYSTEM', // 대문자
            content: agent.systemPrompt
          }
        });
      }
    }

    // 사용자 메시지 저장
    await prisma.message.create({
      data: {
        conversationId: session.id,
        role: 'USER', // 대문자
        content: message
      }
    });

    // 대화 기록 포맷팅
    const history = (session.messages ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }));

    // 에이전트 실행
    const executor = new AgentExecutor(agent.config);
    const result = await executor.execute(message, history);

    // 응답 메시지 저장
    await prisma.message.create({
      data: {
        conversationId: session.id,
        role: 'ASSISTANT', // 대문자
        content: result.message || '오류가 발생했습니다.',
        metadata: result.toolCalls ? { toolCalls: JSON.stringify(result.toolCalls) } : undefined // JSON 문자열로 변환
      }
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      sessionId: session.id,
      toolCalls: result.toolCalls
    });
  } catch (error) {
    console.error('에이전트 실행 오류:', error);
    return NextResponse.json(
      { error: '에이전트를 실행하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}