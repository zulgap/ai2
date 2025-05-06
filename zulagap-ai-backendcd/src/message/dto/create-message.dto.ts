import { MessageRole } from '@prisma/client';

export class CreateMessageDto {
  content: string;
  role: MessageRole;
  conversationId: string;
  nodeId?: string;
  agentId?: string;
  workflowExecutionId?: string;
}