import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentModule } from '../document/document.module';
import { MessageController } from './message.controller'; // ← 추가

@Module({
  imports: [DocumentModule],
  providers: [MessageService, PrismaService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}