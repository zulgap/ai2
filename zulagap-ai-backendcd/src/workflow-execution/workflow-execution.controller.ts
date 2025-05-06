import { Controller, Get, Post, Patch, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ConversationService } from '../conversation/conversation.service';
import { CreateWorkflowExecutionDto } from './dto/create-workflow-execution.dto';
import { UpdateWorkflowExecutionDto } from './dto/update-workflow-execution.dto';
import { AgentSessionService } from '../agent-session/agent-session.service';

@Controller('workflow-executions')
export class WorkflowExecutionController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowService: WorkflowService,
    private readonly conversationService: ConversationService,
    private readonly agentSessionService: AgentSessionService,
  ) {}

  @Post()
  create(@Body() dto: CreateWorkflowExecutionDto) {
    return this.workflowExecutionService.create(dto);
  }

  @Get()
  findAll(
    @Query('workflowId') workflowId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.workflowExecutionService.findAll({ workflowId, userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workflowExecutionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowExecutionDto) {
    return this.workflowExecutionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workflowExecutionService.remove(id);
  }

  @Post(':workflowId/trigger')
  async triggerExecution(
    @Param('workflowId') workflowId: string,
    @Body() body: { userId: string; input?: any; conversationId?: string }
  ) {
    const execution = await this.workflowExecutionService.create({
      workflowId,
      userId: body.userId,
      input: body.input,
      status: 'RUNNING',
      startedAt: new Date(),
    });

    // 워크플로우 실행 시 노드별 에이전트 세션 생성
    const workflow = await this.workflowService.findOne(workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    const agentIds = (workflow.nodes ?? []).map(n => n.leaderAgentId).filter((id): id is string => !!id);

    for (const agentId of agentIds) {
      if (!agentId) continue;
      await this.agentSessionService.create({
        agentId,
        workflowExecutionId: execution.id,
        userId: body.userId,
        status: 'ACTIVE',
        createdAt: new Date(),
      });
    }

    try {
      // conversationId를 body에서 받거나, 없으면 새로 생성
      let conversationId = body.conversationId;
      if (!conversationId) {
        const conversation = await this.conversationService.create({
          userId: body.userId,
          agentId: agentIds[0],
          workflowExecutionId: execution.id,
          nodeId: workflow.nodes?.[0]?.id ?? '',
          title: '워크플로우 실행 대화',
        });
        conversationId = conversation.id;
      }

      // 워크플로우 실행
      const result = await this.workflowService.executeWorkflow(
        workflowId,
        body.input,
        conversationId,
        execution.id
      );

      await this.workflowExecutionService.update(execution.id, {
        status: 'COMPLETED',
        endedAt: new Date(),
        output: result,
      });

      return { executionId: execution.id, status: 'COMPLETED', output: result, conversationId };
    } catch (e) {
      await this.workflowExecutionService.update(execution.id, {
        status: 'FAILED',
        endedAt: new Date(),
        error: e.message,
      });
      throw e;
    }
  }

  // 실행 이력에 연결된 메시지 조회
  @Get(':executionId/messages')
  getMessages(@Param('executionId') executionId: string) {
    if (!executionId) throw new NotFoundException('executionId is required');
    return this.workflowExecutionService.getMessages(executionId);
  }

  // 실행 이력에 메시지 추가
  @Post(':executionId/messages')
  postMessage(@Param('executionId') executionId: string, @Body() body: any) {
    if (!executionId) throw new NotFoundException('executionId is required');
    return this.workflowExecutionService.createMessage(executionId, body.agentId, body);
  }
}