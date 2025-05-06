export class CreateNodeDto {
  type: string;
  name: string;
  position: any;
  data: any;
  workflowId: string;
  leaderAgentId?: string | null;
  inputs?: any;
  outputs?: any;
  order: number; // ← 필수 필드 추가
}