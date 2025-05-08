export type NodeUpdateInput = {
  id?: string;
  name: string;
  type: string;
  leaderAgentId?: string;
  workerAgentId?: string; // 추가
  order?: number;
  position?: any;
  data?: any;
};

export class UpdateWorkflowDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  nodes?: NodeUpdateInput[];
}