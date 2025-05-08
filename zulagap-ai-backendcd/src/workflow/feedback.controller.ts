import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // 피드백 생성
  @Post()
  async create(@Body() body: {
    workflowExecutionId: string;
    nodeId: string;
    fromAgentId: string;
    toAgentId: string;
    feedbackType: string;
    content: string;
  }) {
    if (!body.nodeId) {
      throw new BadRequestException('nodeId는 필수입니다.');
    }
    return this.feedbackService.createFeedback(body);
  }

  // 워크플로우 실행 기준 피드백 조회
  @Get('execution/:executionId')
  async getByExecution(@Param('executionId') executionId: string) {
    return this.feedbackService.getFeedbacksByExecution(executionId);
  }

  // 노드 기준 피드백 조회
  @Get('node/:nodeId')
  async getByNode(@Param('nodeId') nodeId: string) {
    return this.feedbackService.getFeedbacksByNode(nodeId);
  }
}