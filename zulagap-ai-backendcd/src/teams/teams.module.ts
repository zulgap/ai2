import { forwardRef, Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamService, TeamDocumentService, TeamRagService } from './teams.service'; // TeamRagService import
import { PrismaService } from '../prisma/prisma.service';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [forwardRef(() => DocumentModule)],
  controllers: [TeamsController],
  providers: [TeamService, TeamDocumentService, TeamRagService, PrismaService], // TeamRagService 추가
  exports: [TeamService, TeamDocumentService, TeamRagService], // 필요시 export에도 추가
})
export class TeamModule {}
