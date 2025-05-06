import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 에이전트 목록 조회
export async function GET(request: Request) {
  console.log('GET /api/agents called');
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');

    const where: any = teamId
      ? { teamId }
      : userId
        ? { OR: [{ userId }, { isPublic: true }] }
        : { isPublic: true };

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    console.log('GET: 에이전트 목록 조회 성공:', agents.length);
    return NextResponse.json(agents);
  } catch (error) {
    console.error('에이전트 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '에이전트 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 에이전트 생성
export async function POST(request: Request) {
  console.log('POST /api/agents called');
  try {
    const {
      name,
      description,
      userId,
      teamId,
      config,
      role,
      ragDocs,
      prompt,
      model,
      temperature,
      type,
      isPublic
    } = await request.json();

    if (!name || !userId) {
      console.warn('POST: name, userId required');
      return NextResponse.json(
        { error: 'name, userId required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        userId,
        teamId,
        config: config ?? {
          model,
          temperature,
          ragDocs,
          prompt,
        },
        role,
        ragDocs,
        prompt,
        model,
        temperature,
        type,
        isPublic: isPublic ?? false
      }
    });

    console.log('POST: 에이전트 생성 성공:', agent.id);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('에이전트 생성 오류:', error);
    return NextResponse.json(
      { error: '에이전트를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 에이전트 수정 (PUT)
export async function PUT(request: Request) {
  console.log('PUT /api/agents called');
  try {
    const {
      id,
      name,
      description,
      userId,
      teamId,
      config,
      role,
      ragDocs,
      prompt,
      model,
      temperature,
      type,
      isPublic
    } = await request.json();

    if (!id) {
      console.warn('PUT: id required');
      return NextResponse.json(
        { error: 'id required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name,
        description,
        userId,
        teamId,
        config: config ?? {
          model,
          temperature,
          ragDocs,
          prompt,
        },
        role,
        ragDocs,
        prompt,
        model,
        temperature,
        type,
        isPublic: isPublic ?? false
      }
    });

    console.log('PUT: 에이전트 수정 성공:', agent.id);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('에이전트 수정 오류:', error);
    return NextResponse.json(
      { error: '에이전트를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 에이전트 삭제 (DELETE)
export async function DELETE(request: Request) {
  console.log('DELETE /api/agents called');
  try {
    const { id } = await request.json();
    if (!id) {
      console.warn('DELETE: id required');
      return NextResponse.json(
        { error: 'id required' },
        { status: 400 }
      );
    }
    await prisma.agent.delete({ where: { id } });
    console.log('DELETE: 에이전트 삭제 성공:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('에이전트 삭제 오류:', error);
    return NextResponse.json(
      { error: '에이전트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}