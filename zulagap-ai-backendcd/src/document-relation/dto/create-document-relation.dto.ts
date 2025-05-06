export class CreateDocumentRelationDto {
  fromId: string;
  toId: string;
  type: string;
  prompt?: string;
  seq?: number;
  brandId: string; // ← 이 줄 추가
}
