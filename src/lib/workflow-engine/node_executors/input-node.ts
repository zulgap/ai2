import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";

export class InputNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const initialData = node.data?.initialData || {};
      const result = {
        ...inputs,
        ...initialData,
      };

      return {
        success: true,
        data: result,
        nextNodeIds: [], // 다음 노드가 없으므로 빈 배열로 설정
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시에도 빈 배열 반환
      };
    }
  }
}