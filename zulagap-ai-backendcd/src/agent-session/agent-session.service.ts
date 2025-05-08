import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    agentId: string;
    userId?: string;
    messages?: any[];
    variables?: any;
    createdAt?: Date;
    updatedAt?: Date;
    status?: string;
    workflowExecutionId?: string;
  }) {
    // agentId 검증 추가
    const agentExists = await this.prisma.agent.findUnique({
      where: { id: data.agentId }
    });
    if (!agentExists) throw new Error(`에이전트(ID: ${data.agentId})가 존재하지 않습니다.`);

    // userId 검증 (있는 경우에만)
    if (data.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: data.userId }
      });
      if (!userExists) throw new Error(`사용자(ID: ${data.userId})가 존재하지 않습니다.`);
    }

    // 세션 생성
    return this.prisma.agentSession.create({
      data: {
        agentId: data.agentId,
        userId: data.userId || null, // null로 명시적 지정
        messages: data.messages ?? [],
        variables: data.variables ?? {},
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
        status: data.status,
      },
    });
  }

  async findAll(where: any = {}) {
    return this.prisma.agentSession.findMany({ 
      where,
      include: {
        agent: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id: string) {
    const session = await this.prisma.agentSession.findUnique({
      where: { id },
      include: { 
        agent: true,
        user: true,
        nodeResults: true
      }
    });
    
    if (!session) {
      throw new NotFoundException(`에이전트 세션(ID: ${id})을 찾을 수 없습니다.`);
    }
    
    return session;
  }

  async update(id: string, data: {
    messages?: any[];
    variables?: any;
    status?: string;
  }) {
    // 세션 존재 여부 확인
    const session = await this.prisma.agentSession.findUnique({
      where: { id }
    });
    
    if (!session) {
      throw new NotFoundException(`에이전트 세션(ID: ${id})을 찾을 수 없습니다.`);
    }
    
    // 업데이트할 데이터 객체 생성
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // 조건부로 필드 추가
    if (data.messages !== undefined) {
      updateData.messages = data.messages;
    }
    
    if (data.variables !== undefined) {
      updateData.variables = data.variables;
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    // 업데이트 수행
    return this.prisma.agentSession.update({
      where: { id },
      data: updateData,
      include: {
        agent: true,
        user: true
      }
    });
  }

  async remove(id: string) {
    // 세션 존재 여부 확인
    const session = await this.prisma.agentSession.findUnique({
      where: { id }
    });
    
    if (!session) {
      throw new NotFoundException(`에이전트 세션(ID: ${id})을 찾을 수 없습니다.`);
    }
    
    // 삭제 수행
    return this.prisma.agentSession.delete({
      where: { id }
    });
  }
}
