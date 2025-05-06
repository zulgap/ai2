import { forwardRef, Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamService, TeamDocumentService, TeamRagService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [forwardRef(() => DocumentModule)],
  controllers: [TeamsController],
  providers: [TeamService, TeamDocumentService, TeamRagService, PrismaService],
  exports: [TeamService],
})
export class TeamModule {}
