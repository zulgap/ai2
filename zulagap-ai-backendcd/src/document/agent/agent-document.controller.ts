import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentDocumentService } from './agent-document.service';

@Controller('agents/:agentId/documents')
export class AgentDocumentController {
  constructor(private readonly agentDocService: AgentDocumentService) {}

  @Get()
  async findAllByAgent(@Param('agentId') agentId: string) {
    return this.agentDocService.findAllByAgent(agentId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Param('agentId') agentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    console.log('body:', body); // body.title, body, etc.
    console.log('file:', file); // file, file.originalname
    return this.agentDocService.createForAgent(agentId, body, file);
  }

  @Post('relations')
  async saveRelations(
    @Param('agentId') agentId: string,
    @Body() body: any,
  ) {
    // body.relations: [{from, to, type, prompt}]
    return this.agentDocService.saveRelations(agentId, body.relations);
  }

  @Delete(':documentId')
  async removeFromAgent(
    @Param('agentId') agentId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.agentDocService.removeFromAgent(agentId, documentId);
  }

  @Get('/rag')
  async getAgentRagDocs(@Param('agentId') agentId: string) {
    return this.agentDocService.getAgentRagDocs(agentId);
  }
}