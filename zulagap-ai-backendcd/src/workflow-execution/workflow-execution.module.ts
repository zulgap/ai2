import { Module, forwardRef } from '@nestjs/common';
import { WorkflowExecutionController } from './workflow-execution.controller';
import { WorkflowExecutionService } from './workflow-execution.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { ConversationModule } from '../conversation/conversation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageModule } from '../message/message.module'; // MessageModule import
import { AgentSessionModule } from '../agent-session/agent-session.module';

@Module({
  imports: [
    PrismaModule,
    MessageModule, // 반드시 추가!
    WorkflowModule,
    ConversationModule,
    AgentSessionModule, // 반드시 추가!
  ],
  controllers: [WorkflowExecutionController],
  providers: [WorkflowExecutionService, PrismaService],
  exports: [WorkflowExecutionService],
})
export class WorkflowExecutionModule {}