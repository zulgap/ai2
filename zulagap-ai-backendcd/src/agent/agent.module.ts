import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service';
import { AgentDocumentService } from '../document/agent/agent-document.service'; // 추가
import { DocumentModule } from '../document/document.module'; // 문서 모듈이 있다면 import

@Module({
  imports: [DocumentModule], // 문서 관련 모듈 import (없으면 생략)
  controllers: [AgentController],
  providers: [AgentService, PrismaService, DocumentService, AgentDocumentService], // AgentDocumentService 추가
  exports: [AgentService],
})
export class AgentModule {}