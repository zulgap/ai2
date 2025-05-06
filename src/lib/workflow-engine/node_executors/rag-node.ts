import type { NodeExecutor, NodeExecutionResult, WorkflowContext } from "@/lib/workflow-engine/types-folder/types";
import { createClient } from "@supabase/supabase-js";

export class RagNodeExecutor implements NodeExecutor {
  async execute(node: any, inputs: Record<string, any>, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      // 입력에서 검색어 추출
      const query = inputs.query || "";
      if (!query) {
        throw new Error("검색어가 제공되지 않았습니다.");
      }

      // RAG 설정 추출
      const topK = node.data?.topK || 3;
      const collection = node.data?.collection || "default";

      // Supabase 클라이언트 생성
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 임베딩 생성
      const embedding = await this.getEmbedding(query);

      // 벡터 검색 수행
      const { data: documents, error } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_count: topK,
      });

      if (error) {
        throw new Error(`벡터 검색 오류: ${error.message}`);
      }

      // 컨텍스트 생성
      const context_text = documents.map((doc: any) => doc.content).join("\n\n");

      return {
        success: true,
        data: {
          documents,
          context: context_text,
        },
        nextNodeIds: [], // 다음 노드가 없으므로 빈 배열로 설정
      };
    } catch (error) {
      console.error("RAG 노드 실행 오류:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        nextNodeIds: [], // 에러 발생 시에도 빈 배열 반환
      };
    }
  }

  // 임베딩 생성 함수
  private async getEmbedding(text: string): Promise<number[]> {
    // OpenAI API를 사용하여 임베딩 생성
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${result.error?.message || "알 수 없는 오류"}`);
    }

    return result.data[0].embedding;
  }
}
