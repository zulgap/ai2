import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { AgentDocumentService } from './agent-document.service';

@Controller('api/agent-documents')
export class AgentDocumentController {
  constructor(private readonly agentDocService: AgentDocumentService) {}

  @Get(':agentId')
  async findAllByAgent(@Param('agentId') agentId: string) {
    return this.agentDocService.findAllByAgent(agentId);
  }

  @Post(':agentId')
  async createForAgent(@Param('agentId') agentId: string, @Body() data: any) {
    return this.agentDocService.createForAgent(agentId, data);
  }

  @Delete(':agentId/:documentId')
  async removeFromAgent(@Param('agentId') agentId: string, @Param('documentId') documentId: string) {
    return this.agentDocService.removeFromAgent(agentId, documentId);
  }
}