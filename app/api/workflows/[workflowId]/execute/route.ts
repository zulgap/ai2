import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { workflowId: string } }
) {
  const { input } = await request.json();
  const { workflowId } = params;

  // 워크플로우, 노드, 팀장/에이전트 정보 불러오기
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: true, team: true, leaderAgent: true },
  });
  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  // 1. AgentSession 생성
  const agentSession = await prisma.agentSession.create({
    data: {
      agentId: workflow.leaderAgentId ?? workflow.agentId ?? '',
      userId: '', // userId 없이도 동작
      messages: [],
      status: 'RUNNING',
    },
  });

  // 2. 실행 이력 생성
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId: '', // userId 없이도 동작
      agentSessionId: agentSession.id,
      status: 'RUNNING',
      input,
    },
  });

  // 3. Conversation 생성 (첫 노드 기준)
  const firstNode = workflow.nodes.sort((a, b) => a.order - b.order)[0];
  const conversation = await prisma.conversation.create({
    data: {
      userId: '', // userId 없이도 동작
      agentId: workflow.leaderAgentId ?? workflow.agentId ?? '',
      workflowExecutionId: execution.id,
      nodeId: firstNode?.id ?? '',
      title: `워크플로우 실행 #${execution.id}`,
    },
  });

  // 4. Message 생성 (실행 시작 메시지)
  const message = await prisma.message.create({
    data: {
      content: '워크플로우 실행이 시작되었습니다.',
      role: 'SYSTEM',
      conversationId: conversation.id,
      nodeId: firstNode?.id ?? null,
      agentId: workflow.leaderAgentId ?? workflow.agentId ?? null,
      workflowExecutionId: execution.id,
    },
  });

  return NextResponse.json({
    executionId: execution.id,
    agentSessionId: agentSession.id,
    conversationId: conversation.id,
    messageId: message.id,
    agentSession,
    conversation,
    message,
    execution,
  });
}