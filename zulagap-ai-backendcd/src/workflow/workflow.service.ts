import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // ← 경로 수정
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { TeamLeaderType } from '@prisma/client'; // ← enum import 필요

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workflow.findMany({
      include: { nodes: true },
      orderBy: { createdAt: 'desc' },
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
        ...(dto.userId ? { userId: dto.userId } : {}), // userId가 있을 때만 포함
        nodes: dto.nodes
          ? {
              create: dto.nodes.map((n, idx) => ({
                name: n.name,
                type: n.type,
                leaderAgentId: n.leaderAgentId ?? null,
                position: {}, // 기본값 (빈 객체)
                data: {},     // 기본값 (빈 객체)
                order: idx,   // 순서 지정
              })),
            }
          : undefined,
      },
      include: { nodes: true },
    });
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    return this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic,
        // 노드 수정 등 추가 구현 필요시 여기에 작성
      },
      include: { nodes: true },
    });
  }

  async remove(id: string) {
    return this.prisma.workflow.delete({
      where: { id },
    });
  }
}