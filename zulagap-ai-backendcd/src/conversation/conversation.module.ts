import { Module, forwardRef } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => WorkflowModule), // 반드시 forwardRef 사용
    PrismaModule,
  ],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}