import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowExecutionDto } from './dto/create-workflow-execution.dto';
import { UpdateWorkflowExecutionDto } from './dto/update-workflow-execution.dto';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateWorkflowExecutionDto) {
    console.log('create workflowExecution', dto); // dto에 어떤 값이 들어오는지 확인
    try {
      return await this.prisma.workflowExecution.create({ data: dto });
    } catch (e) {
      console.error('WorkflowExecution create error:', e);
      // FK 위반 등 Prisma 에러의 meta 정보도 출력
      if (e instanceof Error && 'meta' in e) {
        console.error('Prisma error meta:', (e as any).meta);
      }
      throw e;
    }
  }

  async findAll(filter: { workflowId?: string; userId?: string }) {
    return this.prisma.workflowExecution.findMany({
      where: {
        ...(filter.workflowId && { workflowId: filter.workflowId }),
        ...(filter.userId && { userId: filter.userId }),
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.workflowExecution.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateWorkflowExecutionDto) {
    return this.prisma.workflowExecution.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.workflowExecution.delete({ where: { id } });
  }

  async getMessages(executionId: string) {
    return this.prisma.message.findMany({
      where: { workflowExecutionId: executionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(executionId: string, agentId: string, body: any) {
    return this.prisma.message.create({
      data: {
        content: body.content,
        role: body.role ?? 'USER',
        workflowExecutionId: executionId,
        agentId,
        ...body,
      },
    });
  }
}