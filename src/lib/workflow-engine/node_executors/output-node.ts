import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";
import { InputNodeExecutor } from "@/lib/workflow-engine/node_executors/input-node";

export class OutputNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      return {
        success: true,
        data: inputs.input,
        nextNodeIds: [], // 빈 배열 추가
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 빈 배열 추가
      };
    }
  }
}