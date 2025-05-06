export interface WorkflowContext {
  workflowId: string;
  nodeResults: Record<string, any>;
  currentNodeId: string | null;
  startTime: number;
  userId: string;
  variables: Record<string, any>;
  errors: Record<string, Error>;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  nextNodeIds: string[]; // 항상 배열로 정의
}

export interface NodeExecutor {
  execute: (node: any, inputs: Record<string, any>, context: WorkflowContext) => Promise<NodeExecutionResult>;
}

// Agent 타입 추가
export interface Agent {
  id: string;
  name: string;
  description?: string; // 선택적 필드
  createdAt: string;
  updatedAt: string;
  config: Record<string, any>; // 설정 데이터를 담는 객체
}

export interface Node {
  id: string; // 필수 속성으로 설정
  type: string;
  data?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  success: boolean; // 워크플로우 실행 성공 여부
  output?: any; // 최종 출력 데이터
  executionTime: number; // 실행 시간 (밀리초)
  nodeResults: Record<string, any>; // 각 노드의 실행 결과
  error?: Error; // 실행 중 발생한 에러 (선택적)
}