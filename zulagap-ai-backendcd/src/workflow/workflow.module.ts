import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

@Module({
  controllers: [WorkflowController, NodeController, ExecutionController],
  providers: [WorkflowService, NodeService, PrismaService, ExecutionService],
  exports: [WorkflowService, NodeService],
})
export class WorkflowModule {}