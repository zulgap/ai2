import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  create(@Body() body: any) {
    const { agentId, leaderAgentId, userId, teamId, brandId, ...rest } = body;
    return this.workflowService.create({
      ...rest,
      user: { connect: { id: userId } },
      ...(teamId && { team: { connect: { id: teamId } } }),
      ...(brandId && { brand: { connect: { id: brandId } } }),
      ...(agentId && { agent: { connect: { id: agentId } } }),
      ...(leaderAgentId && { leaderAgent: { connect: { id: leaderAgentId } } }),
    });
  }

  // brandId, teamId로 필터링 지원
  @Get()
  async findAll(@Query('brandId') brandId?: string, @Query('teamId') teamId?: string) {
    let result: any;
    if (brandId) {
      result = await this.workflowService.findByBrand(brandId);
    } else if (teamId) {
      result = await this.workflowService.findByTeam(teamId);
    } else {
      result = await this.workflowService.findAll();
    }
    // 항상 배열만 반환
    return Array.isArray(result) ? result : [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Get(':id/agents')
  findAgents(@Param('id') id: string) {
    return this.workflowService.findAgents(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }
}