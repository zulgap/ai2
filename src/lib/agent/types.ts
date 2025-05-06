// 에이전트 타입 정의
export interface Agent {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  config: AgentConfig;
}

export interface AgentConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: AgentTool[];
}

export interface AgentTool {
  name: string;
  description: string;
  type: 'function' | 'workflow' | 'api';
  config: Record<string, any>;
}

export interface AgentSession {
  id: string;
  agentId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: AgentMessage[];
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface AgentExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  toolCalls?: AgentToolCall[];
}

export interface AgentToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
}