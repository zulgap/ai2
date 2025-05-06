import { TeamLeaderType } from '@prisma/client';

export class CreateWorkflowDto {
  name: string;
  userId: string;
  teamId?: string;
  description?: string;
  config?: any;
  isPublic?: boolean;
  teamLeaderType?: TeamLeaderType; // ← enum으로 변경
  leaderAgentId?: string | null;   // ← null 허용
  nodes?: any[]; // 실제 노드 타입이 있다면 그 타입으로 지정
}