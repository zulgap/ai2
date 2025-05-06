import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AgentSessionService } from '../agent-session/agent-session.service';
import { WorkflowExecutionService } from '../workflow-execution/workflow-execution.service';
import { WorkflowService } from '../workflow/workflow.service';

@Controller('api/conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly agentSessionService: AgentSessionService,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Post()
  create(@Body() body: any) {
    const { userId, agentId, workflowExecutionId, nodeId, ...rest } = body;
    return this.conversationService.create({
      ...rest,
      user: { connect: { id: userId } },
      agent: { connect: { id: agentId } },
      ...(workflowExecutionId && { workflowExecution: { connect: { id: workflowExecutionId } } }),
      nodeId,
    });
  }

  @Get()
  findAll(
    @Query('workflowExecutionId') workflowExecutionId?: string,
    @Query('userId') userId?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.conversationService.findAll({ workflowExecutionId, userId, agentId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConversationDto) {
    return this.conversationService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }

  @Post(':workflowId/trigger')
  async triggerExecution(
    @Param('workflowId') workflowId: string,
    @Body() body: { userId: string; input?: any }
  ) {
    const execution = await this.workflowExecutionService.create({
      workflowId,
      userId: body.userId,
      input: body.input,
      status: 'RUNNING',
      startedAt: new Date(),
    });

    const workflow = await this.workflowService.findOne(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    const agentIds = (workflow.nodes ?? []).map(n => n.leaderAgentId).filter((id): id is string => !!id);

    const conversation = await this.conversationService.create({
      userId: body.userId,
      agentId: agentIds[0],
      workflowExecutionId: execution.id,
      nodeId: workflow.nodes?.[0]?.id ?? '',
      title: '워크플로우 실행 대화',
    });

    return conversation;
  }
}