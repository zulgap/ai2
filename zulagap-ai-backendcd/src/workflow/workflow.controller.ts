import { Body, Controller, Get, Post, Patch, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ExecutionService } from './execution.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly executionService: ExecutionService
  ) {}

  @Get()
  async findAll() {
    return this.workflowService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateWorkflowDto) {
    return this.workflowService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workflowService.remove(id);
  }

  @Post(':id/execute')
  async execute(@Param('id') id: string, @Body() body: any) {
    const userId = body.userId || '';
    const input = body.input || {};
    return this.executionService.execute(id, userId, input);
  }

  @Post(':id/execute-all')
  async executeAll(
    @Param('id') id: string,
    @Body() dto: { userId: string; input?: any },
  ) {
    try {
      return this.executionService.executeAllNodes(id, dto.userId, dto.input);
    } catch (error) {
      throw new HttpException(
        `워크플로우 전체 실행 실패: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}