import { Module } from '@nestjs/common';
import { AgentSessionService } from './agent-session.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AgentSessionService],
  exports: [AgentSessionService],
})
export class AgentSessionModule {}