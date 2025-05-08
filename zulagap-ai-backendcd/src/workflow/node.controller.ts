import { Controller, Post, Patch, Delete, Get, Body, Param, Query } from '@nestjs/common';
import { NodeService } from './node.service';

@Controller('nodes')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  // 워크플로우별 노드 전체 조회
  @Get()
  async findByWorkflow(@Query('workflowId') workflowId: string) {
    return this.nodeService.findByWorkflow(workflowId);
  }

  // 노드 단일 조회
  @Get(':nodeId')
  async findOne(@Param('nodeId') nodeId: string) {
    return this.nodeService.findOne(nodeId);
  }

  // 워크플로우에 노드 추가
  @Post()
  async create(@Body() dto: { workflowId: string; name: string; type: string; leaderAgentId?: string; order: number }) {
    return this.nodeService.create({
      workflowId: dto.workflowId,
      name: dto.name,
      type: dto.type,
      leaderAgentId: dto.leaderAgentId,
      order: dto.order,
    });
  }

  // 노드 수정
  @Patch(':nodeId')
  async update(
    @Param('nodeId') nodeId: string,
    @Body() dto: { name?: string; type?: string; leaderAgentId?: string; order?: number }
  ) {
    return this.nodeService.update(nodeId, dto);
  }

  // 노드 삭제
  @Delete(':nodeId')
  async delete(@Param('nodeId') nodeId: string) {
    return this.nodeService.delete(nodeId);
  }

  // 노드 순서(order)만 별도 변경
  @Patch(':nodeId/order')
  async updateOrder(@Param('nodeId') nodeId: string, @Body() body: { order: number }) {
    return this.nodeService.update(nodeId, { order: body.order });
  }

  // 노드 병렬/분기(flow) 정보 변경 (옵션)
  @Patch(':nodeId/flow')
  async updateFlow(@Param('nodeId') nodeId: string, @Body() body: { flowData: any }) {
    return this.nodeService.update(nodeId, { data: { flow: body.flowData } });
  }
}