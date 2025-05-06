import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";
import { OpenAI } from "openai";
import { InputNodeExecutor } from "@/lib/workflow-engine/node_executors/input-node";

export class LlmNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      // 입력에서 프롬프트와 시스템 메시지 추출
      const prompt = inputs.prompt || node.data?.defaultPrompt || "안녕하세요";
      const system = inputs.system || node.data?.defaultSystem || "";

      // 모델 설정 추출
      const model = node.data?.model || "gpt-4o";
      const temperature = node.data?.temperature || 0.7;
      const maxTokens = node.data?.maxTokens || 1000;

      // OpenAI API 호출
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      });

      return {
        success: true,
        data: response.choices[0].message.content,
        nextNodeIds: [], // 다음 노드가 없으므로 빈 배열로 설정
      };
    } catch (error) {
      console.error("LLM 노드 실행 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시에도 빈 배열 반환
      };
    }
  }
}