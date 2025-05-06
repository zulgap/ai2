import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { AgentConfig, AgentExecutionResult, AgentToolCall } from './types';
import { executeToolCall } from './tools/index';

type MessageRole = 'user' | 'assistant' | 'system' | 'data';

export class AgentExecutor {
  private config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  async execute(
    message: string, 
    history: Array<{ role: MessageRole; content: string }>
  ): Promise<AgentExecutionResult> {
    try {
      // 1. LLM 호출 준비
      const model = this.config.model || 'gpt-4o';
      const temperature = this.config.temperature || 0.7;
      const maxTokens = this.config.maxTokens || 2000;
      const systemPrompt = this.config.systemPrompt || '당신은 도움이 되는 AI 어시스턴트입니다.';

      // 2. 도구 정의 (있는 경우)
      const toolsArr = this.config.tools?.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.config.parameters || {}
        }
      })) || [];

      // ai-sdk는 tools를 객체(ToolSet)로 요구함
      const tools = toolsArr.length
        ? toolsArr.reduce((acc, tool) => {
            acc[tool.function.name] = tool;
            return acc;
          }, {} as Record<string, any>)
        : undefined;

      // 3. LLM 호출
      const { text, toolCalls: rawToolCalls } = await generateText({
        model: openai(model),
        temperature,
        maxTokens,
        system: systemPrompt,
        messages: [
          ...history,
          { role: 'user' as MessageRole, content: message }
        ],
        tools
      });

      // 4. 도구 호출 처리
      let toolCalls: AgentToolCall[] = [];

      if (rawToolCalls && rawToolCalls.length > 0) {
        toolCalls = await Promise.all(
          rawToolCalls.map(async (call: any) => {
            try {
              const tool = this.config.tools?.find(t => t.name === call.toolName);
              if (!tool) {
                throw new Error(`도구 ${call.toolName}을(를) 찾을 수 없습니다.`);
              }
              const result = await executeToolCall(tool, call.args);
              return {
                name: call.toolName,
                arguments: call.args,
                result
              };
            } catch (error) {
              return {
                name: call.toolName,
                arguments: call.args,
                error: error instanceof Error ? error.message : String(error)
              };
            }
          })
        );

        // 5. 도구 결과를 포함한 후속 응답 생성 (필요한 경우)
        if (toolCalls.some(call => call.result !== undefined)) {
          const toolResults = toolCalls.map(call => 
            `도구: ${call.name}\n인자: ${JSON.stringify(call.arguments)}\n결과: ${
              call.result !== undefined ? JSON.stringify(call.result) : `오류: ${call.error}`
            }`
          ).join('\n\n');
          
          const { text: enhancedText } = await generateText({
            model: openai(model),
            temperature,
            maxTokens,
            system: systemPrompt,
            messages: [
              ...history,
              { role: 'user' as MessageRole, content: message },
              { role: 'assistant' as MessageRole, content: text },
              { role: 'system' as MessageRole, content: `도구 실행 결과:\n${toolResults}\n\n이 정보를 바탕으로 최종 응답을 제공하세요.` }
            ]
          });
          
          return {
            success: true,
            message: enhancedText,
            toolCalls
          };
        }
      }

      // 6. 결과 반환
      return {
        success: true,
        message: text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
      
    } catch (error) {
      console.error('에이전트 실행 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}