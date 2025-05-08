import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { TeamLeaderType } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workflow.findMany({
      include: { nodes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.workflow.findUnique({
      where: { id },
      include: { nodes: true },
    });
  }

  async create(dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        isPublic: dto.isPublic ?? false,
        brandId: dto.brandId ?? null,
        teamId: dto.teamId ?? null,
        teamLeaderType: dto.teamLeaderType as TeamLeaderType,
        leaderAgentId: dto.leaderAgentId ?? null,
        ...(dto.userId ? { userId: dto.userId } : {}),
        nodes: dto.nodes
          ? {
              create: dto.nodes.map((n, idx) => ({
                name: n.name,
                type: n.type,
                leaderAgentId: n.leaderAgentId ?? null,
                workerAgentId: n.workerAgentId ?? null,
                position: {},
                data: {},
                order: n.order ?? idx,
              })),
            }
          : undefined,
      },
      include: { nodes: true },
    });
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    // ...생략 (노드 및 워크플로우 정보 수정만 담당)...
  }

  async remove(id: string) {
    return this.prisma.workflow.delete({
      where: { id },
    });
  }
}