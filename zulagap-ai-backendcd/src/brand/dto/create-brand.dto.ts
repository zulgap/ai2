export class CreateBrandDto {
  name: string;
  identity?: {
    mission?: string;
    gptType?: string;
    guideline?: string;
    relations?: any;
  };
  documents?: string[]; // 문서 ID 배열
}