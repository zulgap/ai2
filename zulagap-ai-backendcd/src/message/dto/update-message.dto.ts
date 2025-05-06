import { MessageRole } from '@prisma/client';

export class UpdateMessageDto {
  content?: string;
  role?: MessageRole;   // ← string → MessageRole로 변경
  nodeId?: string;ring;  // ← 추가
  agentId?: string; // 기타 필요한 필드


}  // 기타 필요한 필드}