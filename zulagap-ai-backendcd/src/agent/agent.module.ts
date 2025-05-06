import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service'; // DocumentService 추가

@Module({
  controllers: [AgentController],
  providers: [AgentService, PrismaService, DocumentService], // DocumentService 포함
  exports: [AgentService], // ← 추가
})
export class AgentModule {}