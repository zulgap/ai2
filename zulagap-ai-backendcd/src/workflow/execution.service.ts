import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus, NodeResult } from '@prisma/client';
import { AgentSessionService } from '../agent-session/agent-session.service'; // 추가

@Injectable()
export class ExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentSessionService: AgentSessionService // 추가
  ) {}

  async execute(workflowId: string, userId?: string, input?: any) {
    // 워크플로우 정보 조회 (리더 agentId 등 필요시)
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true },
    });
    if (!workflow) throw new Error('Workflow not found');

    // 첫 번째 노드 찾기 (order 기준)
    const firstNode = workflow.nodes.sort((a, b) => a.order - b.order)[0];
    const agentId = firstNode?.leaderAgentId ?? firstNode?.workerAgentId;
    if (!agentId) throw new Error('첫 노드에 담당 에이전트가 없습니다.');

    // 에이전트 존재 여부 확인
    const agentExists = await this.prisma.agent.findUnique({
      where: { id: agentId }
    });
    if (!agentExists) throw new Error(`에이전트(ID: ${agentId})가 존재하지 않습니다.`);

    // userId 검증 추가 (null이 아닌 경우에만)
    if (userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      if (!userExists) throw new Error(`사용자(ID: ${userId})가 존재하지 않습니다.`);
    }

    // 세션 생성 부분 수정
    const agentSession = await this.agentSessionService.create({
      agentId,
      userId,
      messages: [],
      status: 'RUNNING',
    });

    // 2. WorkflowExecution 생성
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: userId || null, // null로 명시적 지정
        agentSessionId: agentSession.id,
        status: WorkflowStatus.RUNNING,
        input: input ?? {},
      },
    });

    // 결과 반환
    return {
      executionId: execution.id,
      agentSessionId: agentSession.id,
      status: execution.status,
    };
  }

  // 실행 상태 변경
  async updateStatus(
    executionId: string,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED',
    error?: string
  ) {
    return this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        ...(status === 'FAILED' && error ? { error } : {}),
        ...(status === 'COMPLETED' ? { endedAt: new Date() } : {}),
      },
    });
  }

  async executeNextNode(workflowExecutionId: string, currentNodeId: string) {
    // 현재 노드 정보
    const currentNode = await this.prisma.node.findUnique({ where: { id: currentNodeId } });
    if (!currentNode) throw new Error('Current node not found');

    // 이전 노드 찾기 (order 기준)
    const previousNode = await this.prisma.node.findFirst({
      where: {
        workflowId: currentNode.workflowId,
        order: { lt: currentNode.order },
      },
      orderBy: { order: 'desc' },
    });

    let previousResult: any = null;
    let previousFeedback: any[] = [];
    if (previousNode) {
      previousResult = await this.prisma.nodeResult?.findFirst?.({
        where: {
          workflowExecutionId,
          nodeId: previousNode.id,
        },
        orderBy: { createdAt: 'desc' },
      });
      previousFeedback = await this.prisma.agentFeedback.findMany({
        where: {
          workflowExecutionId,
          nodeId: previousNode.id,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 다음 노드 실행 input/context에 포함
    const nextNodeInput = {
      // ...기존 input...
      previousResult,
      previousFeedback,
    };

    // 실제 노드 실행 로직 호출
    // await this.runNode(currentNodeId, nextNodeInput);
  }

  // 워크플로우 전체 실행
  async executeAllNodes(workflowId: string, userId: string, input?: any) {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true },
      });
      if (!workflow) throw new Error('Workflow not found');
  
      const sortedNodes = workflow.nodes.sort((a, b) => a.order - b.order);
      if (sortedNodes.length === 0) throw new Error('워크플로우에 노드가 없습니다.');
  
      let context = input ?? {};
      const nodeResults: any[] = []; // 타입 이슈 해결
  
      // 워크플로우 실행 생성
      const execution = await this.prisma.workflowExecution.create({
        data: {
          workflowId,
          userId: userId ?? undefined,
          status: 'RUNNING',
          input: input ?? {}
        }
      });
  
      // 각 노드 순서대로 실행
      for (const node of sortedNodes) {
        const agentId = node.leaderAgentId ?? node.workerAgentId;
        if (!agentId) throw new Error(`노드(${node.name})에 담당 에이전트가 없습니다.`);
  
        // 에이전트 존재 여부 확인
        const agentExists = await this.prisma.agent.findUnique({
          where: { id: agentId }
        });
        if (!agentExists) throw new Error(`에이전트(ID: ${agentId})가 존재하지 않습니다.`);
  
        // 에이전트 세션 생성
        const agentSession = await this.prisma.agentSession.create({
          data: {
            agentId,
            userId: userId ?? undefined,
            messages: [],
            status: 'RUNNING',
          },
        });
  
        try {
          // 실제 노드 실행 로직 호출
          const output = await this.runNode(
            node.id, 
            agentSession.id, 
            execution.id,
            context
          );
          
          // 노드 실행 결과 저장
          const nodeResult = await this.prisma.nodeResult.create({
            data: {
              workflowExecutionId: execution.id,
              nodeId: node.id,
              agentSessionId: agentSession.id,
              input: context,
              output, // 실제 실행 결과
              status: 'COMPLETED',
            },
          });
  
          // 다음 노드의 입력으로 현재 노드의 출력 설정
          context = output;
          nodeResults.push(nodeResult);
        } catch (error) {
          // 노드 실행 실패 시
          await this.prisma.nodeResult.create({
            data: {
              workflowExecutionId: execution.id,
              nodeId: node.id,
              agentSessionId: agentSession.id,
              input: context,
              output: { error: error.message },
              status: 'FAILED',
            },
          });
          
          // 세션 상태 업데이트
          await this.prisma.agentSession.update({
            where: { id: agentSession.id },
            data: { status: 'FAILED' }
          });
          
          // 워크플로우 실행 상태 업데이트
          await this.updateStatus(execution.id, 'FAILED', error.message);
          throw error; // 상위로 에러 전파
        }
      }
  
      // 모든 노드 성공적으로 실행 완료
      await this.updateStatus(execution.id, 'COMPLETED');
      
      return {
        executionId: execution.id,
        status: 'COMPLETED',
        nodeResults
      };
    } catch (error) {
      console.error('워크플로우 실행 오류:', error);
      throw error;
    }
  }

  async create(data: {
    workflowId: string;
    userId: string;
    input?: any;
    status?: WorkflowStatus; // 타입도 enum으로!
    startedAt?: Date;
  }) {
    return this.prisma.workflowExecution.create({
      data: {
        workflowId: data.workflowId,
        userId: data.userId,
        input: data.input ?? {},
        status: data.status ?? WorkflowStatus.RUNNING, // enum 사용
        startedAt: data.startedAt ?? new Date(),
      },
    });
  }

  // 노드 실행 메서드 구현
  async runNode(
    nodeId: string, 
    agentSessionId: string, 
    workflowExecutionId: string,
    input: any
  ): Promise<any> {
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId }
    });
    if (!node) throw new Error(`노드(ID: ${nodeId})가 존재하지 않습니다.`);

    // 에이전트 세션 조회
    const session = await this.prisma.agentSession.findUnique({
      where: { id: agentSessionId },
      include: { agent: true }
    });
    if (!session) throw new Error(`에이전트 세션(ID: ${agentSessionId})이 존재하지 않습니다.`);

    // TODO: 실제 에이전트 작업 수행 (AI 호출, 작업 등)
    // 예시: AI 모델 호출 또는 외부 서비스 호출

    // 결과 생성 (실제 구현에서는 실행 결과로 대체)
    const output = {
      result: `노드 ${node.name} 실행 완료`,
      timestamp: new Date(),
      // ... 실제 출력 데이터
    };

  // 수정 후 (수정 코드)
const messages = Array.isArray(session.messages) ? session.messages : [];
const updatedMessages = [...messages, {
  role: 'AGENT',
  content: `노드 ${node.name}가 실행되었습니다.`,
  timestamp: new Date()
}];

    // 세션 업데이트
    await this.prisma.agentSession.update({
      where: { id: agentSessionId },
      data: { 
        messages: updatedMessages,
        status: 'COMPLETED'
      }
    });

    // 결과 반환
    return output;
  }
}