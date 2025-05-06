import { WorkflowStatus } from '@prisma/client';

export class UpdateWorkflowExecutionDto {
  status?: WorkflowStatus;
  input?: any;
  output?: any;
  error?: string;
  logs?: any;
  endedAt?: Date;
  startedAt?: Date; // ← 이 줄 추가
}