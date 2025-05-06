import { Module } from '@nestjs/common';
import { DocumentRelationsService } from './document-relation.service';
import { DocumentRelationController } from './document-relation.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentRelationController],
  providers: [DocumentRelationsService],
  exports: [DocumentRelationsService],
})
export class DocumentRelationModule {}
