import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('api/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }

  @Get()
  findAll(
    @Query('conversationId') conversationId?: string,
    @Query('workflowExecutionId') workflowExecutionId?: string,
    @Query('nodeId') nodeId?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.messageService.findAll({ conversationId, workflowExecutionId, nodeId, agentId });
  }

  @Get('conversation/:conversationId')
  findByConversation(@Param('conversationId') conversationId: string) {
    return this.messageService.findByConversation(conversationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messageService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(id);
  }
}