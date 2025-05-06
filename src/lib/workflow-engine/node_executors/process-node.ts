import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";
import { InputNodeExecutor } from "@/lib/workflow-engine/node_executors/input-node";

export class ProcessNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      // 처리 코드 추출
      const code = node.data?.code || "return { output: input };";
      const input = inputs.input;

      // 코드 실행
      let output: any;
      try {
        // 안전한 방식으로 코드 실행
        const processFunction = new Function("input", "context", code);
        output = processFunction(input, {
          variables: context.variables,
          nodeResults: context.nodeResults,
        });
      } catch (evalError) {
        throw new Error(`코드 실행 오류: ${evalError}`);
      }

      return {
        success: true,
        data: output,
        nextNodeIds: [], // 다음 노드가 없으므로 빈 배열로 설정
      };
    } catch (error) {
      console.error("프로세스 노드 실행 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시에도 빈 배열 반환
      };
    }
  }
}