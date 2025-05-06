import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';

export class UpdateTeamDto {
  @ApiProperty({ required: false })
  name?: string;             // 팀명

  @ApiProperty({ required: false })
  description?: string;      // 팀 설명

  @ApiProperty({ required: false, type: [String] })
  ragDocumentIds?: string[]; // 문서 수정

  @ApiProperty({ required: false })
  category?: string;         // 카테고리
}