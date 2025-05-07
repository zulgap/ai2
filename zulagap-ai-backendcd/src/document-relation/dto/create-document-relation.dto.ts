export class CreateDocumentRelationDto {
  fromId: string;
  toId: string;
  type: string;
  prompt?: string;
  seq?: number;
  brandId?: string;   // ← 선택값으로 변경
  agentId?: string;   // ← 추가
  teamId?: string;    // ← 추가
}
