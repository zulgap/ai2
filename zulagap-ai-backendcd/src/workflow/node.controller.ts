import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { NodeService } from './node.service';

@Controller('workflows/:workflowId/nodes')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  // 노드 추가
  @Post()
  async createNode(
    @Param('workflowId') workflowId: string,
    @Body() dto: { name: string; type: string; leaderAgentId?: string }
  ) {
    return this.nodeService.createNode(workflowId, dto);
  }

  // 노드 수정
  @Patch(':nodeId')
  async updateNode(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: { name?: string; type?: string; leaderAgentId?: string }
  ) {
    return this.nodeService.updateNode(workflowId, nodeId, dto);
  }

  // 노드 삭제
  @Delete(':nodeId')
  async deleteNode(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string
  ) {
    return this.nodeService.deleteNode(workflowId, nodeId);
  }

  // 노드 순서(order) 변경
  @Patch(':nodeId/order')
  async updateNodeOrder(
    @Param('nodeId') nodeId: string,
    @Body() body: { order: number }
  ) {
    return this.nodeService.updateNodeOrder(nodeId, body.order);
  }

  // 노드 병렬/분기(flow) 정보 변경
  @Patch(':nodeId/flow')
  async updateNodeFlow(
    @Param('nodeId') nodeId: string,
    @Body() body: { flowData: any }
  ) {
    return this.nodeService.updateNodeFlow(nodeId, body.flowData);
  }
}