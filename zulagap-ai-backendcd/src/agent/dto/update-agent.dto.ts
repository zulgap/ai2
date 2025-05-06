export class UpdateAgentDto {
  name?: string;
  description?: string;
  config?: any;
  ragDocs?: string[];
  prompt?: string;
  type?: string;
  role?: string;
  isPublic?: boolean;
  identity?: any;
  parentAgentId?: string;
}