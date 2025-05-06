import { TeamLeaderType } from '@prisma/client';

export class UpdateWorkflowDto {
  name?: string;
  description?: string;
  config?: any;
  isPublic?: boolean;
  teamLeaderType?: TeamLeaderType; // ← enum으로 변경
  leaderAgentId?: string | null;   // ← null 허용
}