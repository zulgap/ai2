import { Module } from '@nestjs/common';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NodeController],
  providers: [NodeService, PrismaService],
  exports: [NodeService],
})
export class NodeModule {}