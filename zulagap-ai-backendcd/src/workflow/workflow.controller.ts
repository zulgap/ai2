import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

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
}