import { MessageRole } from '@prisma/client';

export class CreateConversationDto {
  title?: string;
  userId: string;
  agentId: string;
  workflowExecutionId?: string;
  nodeId: string;
}

export class CreateMessageDto {
  content: string;
  role: MessageRole;
  conversationId: string;
  nodeId?: string;
  agentId?: string;
  workflowExecutionId?: string;
}
