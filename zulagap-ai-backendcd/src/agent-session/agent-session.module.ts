import { Module } from '@nestjs/common';
import { AgentSessionController } from './agent-session.controller';
import { AgentSessionService } from './agent-session.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentSessionController],
  providers: [AgentSessionService],
  exports: [AgentSessionService] // 다른 모듈에서 사용할 수 있도록 export
})
export class AgentSessionModule {}