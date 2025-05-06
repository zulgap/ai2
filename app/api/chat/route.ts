import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/chat
export async function POST(request: Request) {
  try {
    const { teamId, message, userId } = await request.json();

    if (!teamId || !message) {
      return NextResponse.json(
        { error: 'teamId와 message는 필수입니다.' },
        { status: 400 }
      );
    }

    // 팀의 대표 에이전트(leader) 또는 첫 번째 에이전트 찾기
    const agent = await prisma.agent.findFirst({
      where: { teamId },
      orderBy: { createdAt: 'asc' }
    });

    if (!agent) {
      return NextResponse.json(
        { error: '해당 팀에 에이전트가 없습니다.' },
        { status: 404 }
      );
    }

    // 대화 세션 생성 또는 기존 세션 사용 (간단화)
    const conversation = await prisma.conversation.create({
      data: {
        title: `${agent.name} 팀 대화`,
        userId: userId || 'anonymous',
        agentId: agent.id
      }
    });

    // 사용자 메시지 저장
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message
      }
    });

    // 에이전트 답변 생성 (여기서는 단순 예시)
    const reply = "작업을 확인했습니다. 다음 단계로 진행할까요?";

    // 답변 메시지 저장
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT', // 여기 대문자로!
        content: reply
      }
    });

    return NextResponse.json({ reply, conversationId: conversation.id });
  } catch (error) {
    console.error('chat api error:', error);
    return NextResponse.json(
      { error: '채팅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}