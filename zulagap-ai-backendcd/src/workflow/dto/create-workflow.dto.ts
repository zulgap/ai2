export class CreateWorkflowDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  brandId?: string;
  teamId?: string;
  teamLeaderType?: string;
  leaderAgentId?: string;
  userId?: string;
  nodes?: {
    name: string;
    type: string;
    leaderAgentId?: string;
    workerAgentId?: string; // 이미 존재하는지 확인
    order?: number;
    position?: any;
    data?: any;
  }[];
}