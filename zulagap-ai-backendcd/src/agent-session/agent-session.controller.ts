import { Controller, Get, Post, Body, Param, Put, Delete, Query, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { AgentSessionService } from './agent-session.service';

@Controller('agent-sessions')
export class AgentSessionController {
  constructor(private readonly agentSessionService: AgentSessionService) {}

  /**
   * 새 에이전트 세션 생성
   */
  @Post()
  async create(@Body() createAgentSessionDto: {
    agentId: string;
    userId?: string;
    messages?: any[];
    variables?: any;
    status?: string;
  }) {
    try {
      return await this.agentSessionService.create(createAgentSessionDto);
    } catch (error) {
      throw new HttpException(
        `에이전트 세션 생성 실패: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * 에이전트 세션 목록 조회 (필터링 지원)
   */
  @Get()
  async findAll(@Query('agentId') agentId?: string, @Query('userId') userId?: string) {
    try {
      const where: any = {};
      if (agentId) where.agentId = agentId;
      if (userId) where.userId = userId;
      
      return await this.agentSessionService.findAll(where);
    } catch (error) {
      throw new HttpException(
        `에이전트 세션 목록 조회 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 특정 ID의 에이전트 세션 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const session = await this.agentSessionService.findById(id);
      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `에이전트 세션 조회 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 에이전트 세션 정보 업데이트
   */
  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateAgentSessionDto: {
      messages?: any[];
      variables?: any;
      status?: string;
    }
  ) {
    try {
      return await this.agentSessionService.update(id, updateAgentSessionDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        `에이전트 세션 업데이트 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 에이전트 세션 삭제
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.agentSessionService.remove(id);
      return { 
        success: true, 
        message: `에이전트 세션(ID: ${id})이 삭제되었습니다.` 
      };
    } catch (error) {
      throw new HttpException(
        `에이전트 세션 삭제 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}