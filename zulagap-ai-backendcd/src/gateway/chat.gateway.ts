import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConversationService } from '../conversation/conversation.service';
import { Module } from '@nestjs/common';
import { ConversationModule } from '../conversation/conversation.module';
import { MessageRole } from '@prisma/client';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly conversationService: ConversationService) {}

  sendMessageToSession(sessionId: string, message: any) {
    this.server.to(sessionId).emit('message', message);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: {
    sessionId: string;
    message: any;
    workflowExecutionId: string;
    nodeId: string;
    agentId: string;
    conversationId: string; // ← 추가
    role: MessageRole;      // ← 추가
  }) {
    await this.conversationService.saveMessage({
      conversationId: data.conversationId, // ← 추가
      workflowExecutionId: data.workflowExecutionId,
      nodeId: data.nodeId,
      agentId: data.agentId,
      content: data.message,
      role: data.role, // ← 추가
    });
    this.server.to(data.sessionId).emit('message', data.message);
  }
}

// 예시: app.module.ts 또는 gateway.module.ts
@Module({
  imports: [ConversationModule],
  providers: [ChatGateway],
})
export class AppModule {}