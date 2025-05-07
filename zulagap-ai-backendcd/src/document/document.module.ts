import { forwardRef, Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AgentService } from '../agent/agent.service';
import { TeamService } from '../teams/teams.service';
import { BrandService } from '../brand/brand.service';
import { TeamModule } from '../teams/teams.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentRelationModule } from '../document-relation/document-relation.module';
import { RagController } from './rag/rag.controller';
import { RagService } from './rag/rag.service';
import { VectorStoreController, VectorSearchController } from './vectorstore/vectorstore.controller';
import { VectorSearchService } from './vectorstore/vectorstore.service';
import { TeamDocumentController } from './team/team-document.controller';
import { TeamDocumentService } from './team/team-document.service';
import { BrandDocumentController } from './brand/brand-document.controller';
import { BrandDocumentService } from './brand/brand-document.service';
import { VectorStoreService } from './vectorstore/vectorstore.service';

@Module({
  imports: [forwardRef(() => TeamModule), PrismaModule, DocumentRelationModule],
  controllers: [
    DocumentController,
    RagController,
    VectorStoreController,
    VectorSearchController,
    TeamDocumentController,
    BrandDocumentController,
  ],
  providers: [
    DocumentService,
    AgentService,
    TeamService,
    BrandService,
    RagService,
    VectorSearchService,
    TeamDocumentService,
    BrandDocumentService,
    VectorStoreService,
  ],
  exports: [DocumentService, VectorStoreService],
})
export class DocumentModule {}