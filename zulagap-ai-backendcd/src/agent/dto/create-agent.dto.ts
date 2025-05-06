export class CreateAgentDto {
  name: string;
  userId: string;
  config: any; // ← 필수로 변경
  description?: string;
  teamId?: string;
  ragDocs?: string[];
  prompt?: string;
  type?: string;
  role?: string;
  isPublic?: boolean;
  identity?: any;
  parentAgentId?: string;
}