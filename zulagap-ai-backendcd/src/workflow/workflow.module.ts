import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ExecutionService } from './execution.service';
import { AgentSessionModule } from '../agent-session/agent-session.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { FeedbackController } from './feedback.controller'; // 추가
import { FeedbackService } from './feedback.service'; // 추가

@Module({
  imports: [
    PrismaModule,
    AgentSessionModule,
  ],
  controllers: [
    WorkflowController, 
    MessageController,
    FeedbackController // 추가
  ],
  providers: [
    WorkflowService, 
    ExecutionService, 
    MessageService,
    FeedbackService // 추가
  ],
  exports: [WorkflowService, ExecutionService],
})
export class WorkflowModule {}