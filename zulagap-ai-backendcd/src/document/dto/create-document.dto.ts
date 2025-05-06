export class CreateDocumentDto {
  title: string;
  content: string;
  size: number;         // 추가
  mimetype: string;     // 추가
  teamId?: string;
  brandId?: string;
  userId?: string;
  workflowId?: string;
  metadata?: any;
  relations?: any;
  embedding?: any;
  agentId?: string;
  source?: string;
}