import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 세션 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const agentId = searchParams.get('agentId');
    
    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }
    
    const where: any = { userId };
    if (agentId) {
      where.agentId = agentId;
    }
    
    const sessions = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '세션 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}