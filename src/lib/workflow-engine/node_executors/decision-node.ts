import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";

export class DecisionNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      // 조건식 추출
      const conditionExpression = node.data?.condition || "value === true";
      const value = inputs.condition;

      // 조건식 평가
      let result: boolean;
      try {
        // 안전한 방식으로 조건식 평가
        const evalFunction = new Function("value", `return ${conditionExpression}`);
        result = evalFunction(value);
      } catch (evalError) {
        throw new Error(`조건식 평가 오류: ${evalError}`);
      }

      // 결과에 따라 다음 노드 결정
      const nextNodeId = result ? node.data?.trueNodeId : node.data?.falseNodeId;

      if (!nextNodeId) {
        throw new Error("다음 노드 ID가 정의되지 않았습니다.");
      }

      return {
        success: true,
        data: value,
        nextNodeIds: [nextNodeId], // 조건에 따라 다음 노드 ID 반환
      };
    } catch (error) {
      console.error("결정 노드 실행 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시 빈 배열 반환
      };
    }
  }
}