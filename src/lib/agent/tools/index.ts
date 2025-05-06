import type { AgentTool } from '../types';
import { executeWorkflow } from '@/lib/workflow-engine';

export async function executeToolCall(
  tool: AgentTool, 
  args: Record<string, any>
): Promise<any> {
  switch (tool.type) {
    case 'function':
      return executeFunctionTool(tool, args);
      
    case 'workflow':
      return executeWorkflowTool(tool, args);
      
    case 'api':
      return executeApiTool(tool, args);
      
    default:
      throw new Error(`지원되지 않는 도구 유형: ${tool.type}`);
  }
}

// 함수 도구 실행 (계산기, 날짜 변환 등 간단한 함수)
async function executeFunctionTool(tool: AgentTool, args: Record<string, any>): Promise<any> {
  const functionMap: Record<string, Function> = {
    // 계산기 함수
    calculator: (expression: string) => {
      // 안전한 수학 표현식 평가
      const sanitized = expression.replace(/[^-()\d/*+.]/g, '');
      try {
        // eslint-disable-next-line no-eval
        return { result: eval(sanitized) };
      } catch (error) {
        throw new Error(`계산 오류: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    // 현재 날짜/시간
    getCurrentDateTime: () => {
      const now = new Date();
      return {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.getTime()
      };
    }
  };
  
  const func = functionMap[tool.config.functionName];
  if (!func) {
    throw new Error(`함수 ${tool.config.functionName}을(를) 찾을 수 없습니다.`);
  }
  
  return func(args);
}

// 워크플로우 도구 실행
async function executeWorkflowTool(tool: AgentTool, args: Record<string, any>): Promise<any> {
  const workflowId = tool.config.workflowId;
  if (!workflowId) {
    throw new Error('워크플로우 ID가 지정되지 않았습니다.');
  }
  
  // 워크플로우 실행
  const result = await executeWorkflow(workflowId, args, 'system');
  return result.output;
}

// API 도구 실행
async function executeApiTool(tool: AgentTool, args: Record<string, any>): Promise<any> {
  const url = tool.config.url;
  if (!url) {
    throw new Error('API URL이 지정되지 않았습니다.');
  }
  
  const method = tool.config.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...tool.config.headers
  };
  
  const options: RequestInit = { method, headers };
  
  if (['POST', 'PUT', 'PATCH'].includes(method) && args) {
    options.body = JSON.stringify(args);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}