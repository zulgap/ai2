import { Module, forwardRef } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { ConversationModule } from '../conversation/conversation.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => ConversationModule),
    PrismaModule,
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}