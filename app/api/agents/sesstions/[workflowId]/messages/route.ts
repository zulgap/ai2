import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 세션 메시지 조회
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    
    const messages = await prisma.message.findMany({
      where: { conversationId: sessionId },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('세션 메시지 조회 오류:', error);
    return NextResponse.json(
      { error: '세션 메시지를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}