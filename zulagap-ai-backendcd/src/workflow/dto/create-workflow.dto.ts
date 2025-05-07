export class CreateWorkflowDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  brandId?: string;
  teamId?: string;
  teamLeaderType?: string;
  leaderAgentId?: string;
  userId?: string; // ← 추가
  nodes?: {
    name: string;
    type: string;
    leaderAgentId?: string;
  }[];
}