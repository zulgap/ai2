import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// 에러 로그를 파일로 저장하는 함수
function logErrorToFile(error: any, context: string, extra?: any) {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, 'agent-api-error.log');
  const logMsg =
    `[${new Date().toISOString()}] [${context}]\n` +
    (extra ? `Request: ${JSON.stringify(extra)}\n` : '') +
    `${error?.stack || error}\n\n`;
  fs.appendFileSync(logPath, logMsg, { encoding: 'utf8' });
}

// 단일 에이전트 조회
export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('GET /api/agents/[workflowId] called with params:', params);
  try {
    const id = params.id;
    const agent = await prisma.agent.findUnique({
      where: { id }
    });
    if (!agent) {
      console.log('GET: 에이전트 없음:', id);
      return NextResponse.json(
        { error: '에이전트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    console.log('GET: 에이전트 조회 성공:', agent);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('에이전트 조회 오류:', error);
    logErrorToFile(error, 'GET /api/agents/[workflowId]', { params });
    return NextResponse.json(
      { error: '에이전트를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 에이전트 업데이트
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log('PUT /api/agents/[workflowId] called with params:', params);
  try {
    const id = params.id;
    const body = await request.json();
    console.log('PUT 요청 body:', body);
    const { name, description, config, isPublic } = body;

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name,
        description,
        config,
        isPublic
      }
    });

    console.log('PUT: 에이전트 업데이트 성공:', agent);
    return NextResponse.json(agent);
  } catch (error) {
    // 터미널과 로그파일 모두에 디버깅 메시지 출력
    console.error('에이전트 업데이트 오류:', error);
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: '수정하려는 에이전트가 존재하지 않습니다.' },
        { status: 404 }
      );
    }
    try {
      const reqBody = await request.json().catch(() => ({}));
      console.error('PUT /api/agents/[workflowId] 요청 파라미터:', { params, ...reqBody });
      logErrorToFile(error, 'PUT /api/agents/[workflowId]', { params, ...reqBody });
    } catch (logErr) {
      console.error('로그 파일 기록 실패:', logErr);
    }
    return NextResponse.json(
      { error: '에이전트를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 에이전트 삭제
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  console.log('DELETE /api/agents/[workflowId] called with params:', params);
  try {
    const id = params.id;
    await prisma.agent.delete({
      where: { id }
    });
    console.log('DELETE: 에이전트 삭제 성공:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('에이전트 삭제 오류:', error);
    logErrorToFile(error, 'DELETE /api/agents/[workflowId]', { params });
    return NextResponse.json(
      { error: '에이전트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
