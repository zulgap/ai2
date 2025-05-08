import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NodeService {
  constructor(private readonly prisma: PrismaService) {}

  // 노드 추가
  async createNode(
    workflowId: string,
    dto: { name: string; type: string; leaderAgentId?: string }
  ) {
    // order는 마지막 노드 다음 순서로 자동 지정
    const lastOrder = await this.prisma.node.count({ where: { workflowId } });
    return this.prisma.node.create({
      data: {
        workflowId,
        name: dto.name,
        type: dto.type,
        leaderAgentId: dto.leaderAgentId ?? null,
        position: {},
        data: {},
        order: lastOrder,
      },
    });
  }

  // 노드 수정
  async updateNode(
    workflowId: string,
    nodeId: string,
    dto: { name?: string; type?: string; leaderAgentId?: string }
  ) {
    return this.prisma.node.update({
      where: { id: nodeId, workflowId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.leaderAgentId !== undefined && { leaderAgentId: dto.leaderAgentId }),
      },
    });
  }

  // 노드 삭제
  async deleteNode(workflowId: string, nodeId: string) {
    return this.prisma.node.delete({
      where: { id: nodeId, workflowId },
    });
  }

  // 노드 순서(order) 변경
  async updateNodeOrder(nodeId: string, order: number) {
    return this.prisma.node.update({
      where: { id: nodeId },
      data: { order },
    });
  }

  // 노드의 병렬/분기(flow) 정보 저장 (예: data 필드에 flow 구조 저장)
  async updateNodeFlow(nodeId: string, flowData: any) {
    return this.prisma.node.update({
      where: { id: nodeId },
      data: { data: flowData },
    });
  }

  async create(data: {
    workflowId: string;
    name: string;
    type: string;
    leaderAgentId?: string;
    order: number;
    position?: any;
    data?: any;
  }) {
    return this.prisma.node.create({
      data: {
        workflowId: data.workflowId,
        name: data.name,
        type: data.type,
        leaderAgentId: data.leaderAgentId ?? null,
        order: data.order,
        position: data.position ?? {},
        data: data.data ?? {},
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    type?: string;
    leaderAgentId?: string;
    order?: number;
    position?: any;
    data?: any;
  }) {
    return this.prisma.node.update({
      where: { id },
      data: {
        ...data,
        leaderAgentId: data.leaderAgentId ?? undefined,
        order: data.order ?? undefined,
        position: data.position ?? undefined,
        data: data.data ?? undefined,
      },
    });
  }

  async findByWorkflow(workflowId: string) {
    return this.prisma.node.findMany({
      where: { workflowId },
      orderBy: { order: 'asc' },
      include: { leaderAgent: true }, // 담당자 정보 포함
    });
  }

  async findOne(id: string) {
    return this.prisma.node.findUnique({
      where: { id },
      include: { leaderAgent: true },
    });
  }

  async delete(nodeId: string) {
    return this.prisma.node.delete({
      where: { id: nodeId },
    });
  }
}