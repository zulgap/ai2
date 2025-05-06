import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";

export class ApiNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      // API 설정 추출
      const url = inputs.url || node.data?.url;
      if (!url) {
        throw new Error("API URL이 제공되지 않았습니다.");
      }

      const method = node.data?.method || "GET";
      const headers = node.data?.headers || {};
      const body = inputs.body || node.data?.body;

      // API 요청 옵션
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // POST, PUT 등의 요청에 body 추가
      if (["POST", "PUT", "PATCH"].includes(method) && body) {
        options.body = JSON.stringify(body);
      }

      // API 요청 실행
      const response = await fetch(url, options);

      // 응답 처리
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        nextNodeIds: [], // 다음 노드가 없으므로 빈 배열로 설정
      };
    } catch (error) {
      console.error("API 노드 실행 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시에도 빈 배열 반환
      };
    }
  }
}