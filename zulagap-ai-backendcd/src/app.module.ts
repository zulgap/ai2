import { Module } from '@nestjs/common';
import { BrandModule } from './brand/brand.module';
import { PrismaService } from './prisma/prisma.service';
// import { TeamMemberModule } from './team-member/team-member.module'; // 이미 삭제
import { AgentModule } from './agent/agent.module';
import { AgentSessionModule } from './agent-session/agent-session.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { DocumentModule } from './document/document.module';
import { WorkflowModule } from './workflow/workflow.module';
import { NodeModule } from './node/node.module';
import { UserModule } from './user/user.module';
import { WorkflowExecutionModule } from './workflow-execution/workflow-execution.module';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles.guard';
// import { TeamRoleGuard } from './guards/team-role.guard';
// import { GatewayModule } from './gateway/gateway.module'; // 실시간 기능 필요시
import { BrandController } from './brand/brand.controller';
import { TeamModule } from './teams/teams.module';
import { VectorStoreService } from './document/vectorstore/vectorstore.service';

@Module({
  imports: [
    TeamModule,
    BrandModule,
    AgentModule,
    AgentSessionModule,
    ConversationModule,
    MessageModule,
    DocumentModule,
    WorkflowModule,
    NodeModule,
    UserModule,
    WorkflowExecutionModule,
    AuthModule,

    // GatewayModule, // 실시간 기능(WebSocket 등) 필요시
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    VectorStoreService,
    { provide: APP_GUARD, useClass: RolesGuard },
    // { provide: APP_GUARD, useClass: TeamRoleGuard }, // 전역 적용시
  ],
  // controllers: [BrandController], // ← 이 줄을 삭제 또는 주석처리!
  exports: [
    PrismaService,
    VectorStoreService,
  ],
})
export class AppModule {}
