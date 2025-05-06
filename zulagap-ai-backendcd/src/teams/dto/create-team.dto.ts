import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty()
  name: string;             // 팀 이름

  @ApiProperty()
  brandId?: string;          // 브랜드 ID (브랜드 아이덴티티 상속)

  @ApiProperty()
  description?: string;     // 팀의 미션/설명/목적

  @ApiProperty()
  ragDocumentIds?: string[];// 연결된 RAG 문서 ID 리스트

  @ApiProperty()
  category?: string;        // 팀 카테고리
}