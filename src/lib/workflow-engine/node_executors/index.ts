import type { NodeExecutor } from "@/lib/workflow-engine/types-folder/types";
import { InputNodeExecutor } from "@/lib/workflow-engine/node_executors/input-node";
import { OutputNodeExecutor } from "@/lib/workflow-engine/node_executors/output-node";
import { LlmNodeExecutor } from "@/lib/workflow-engine/node_executors/llm-node";
import { ProcessNodeExecutor } from "@/lib/workflow-engine/node_executors/process-node";
import { RagNodeExecutor } from "@/lib/workflow-engine/node_executors/rag-node";
import { ApiNodeExecutor } from "@/lib/workflow-engine/node_executors/api-node";
import { DecisionNodeExecutor } from "@/lib/workflow-engine/node_executors/decision-node";

// 노드 타입별 실행기 매핑
const nodeExecutors: Record<string, NodeExecutor> = {
  input: new InputNodeExecutor(),
  output: new OutputNodeExecutor(),
  llm: new LlmNodeExecutor(),
  process: new ProcessNodeExecutor(),
  rag: new RagNodeExecutor(),
  api: new ApiNodeExecutor(),
  decision: new DecisionNodeExecutor(),
};

// 노드 타입에 맞는 실행기 반환
export function getNodeExecutor(nodeType: string): NodeExecutor | null {
  return nodeExecutors[nodeType] || null;
}
