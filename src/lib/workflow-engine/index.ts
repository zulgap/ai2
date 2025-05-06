import type { WorkflowContext, WorkflowExecutionResult, Node } from "@/lib/workflow-engine/types-folder/types";
import { getNodeExecutor } from "@/lib/workflow-engine/node_executors";
import { prisma } from "@/lib/prisma";

export async function executeWorkflow(
  workflowId: string,
  initialInputs: Record<string, any> = {},
  userId: string
): Promise<WorkflowExecutionResult> {
  // 타입 명시적으로 지정
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: true },
  });

  if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
    throw new Error(`워크플로우 ID ${workflowId}를 찾을 수 없거나 노드가 없습니다.`);
  }

  const context: WorkflowContext = {
    workflowId,
    nodeResults: {},
    currentNodeId: null,
    startTime: Date.now(),
    userId,
    variables: { ...initialInputs },
    errors: {},
  };

  const startNode = workflow.nodes.find((node: Node) => node.type === "input");
  if (!startNode) {
    throw new Error("시작 노드(input)가 워크플로우에 없습니다.");
  }

  const nodeQueue: Node[] = [startNode];

  while (nodeQueue.length > 0) {
    const currentNode = nodeQueue.shift();
    if (!currentNode) break;

    const executor = getNodeExecutor(currentNode.type);
    if (!executor) {
      throw new Error(`노드 타입 ${currentNode.type}에 대한 실행기를 찾을 수 없습니다.`);
    }

    try {
      const result = await executor.execute(
        currentNode,
        context.nodeResults[currentNode.id] || {},
        context
      );
      context.nodeResults[currentNode.id] = result.data;

      if (result.nextNodeIds?.length > 0) {
        const nextNodes = workflow.nodes.filter((node: Node) =>
          result.nextNodeIds.includes(node.id)
        );
        nodeQueue.push(...nextNodes);
      }
    } catch (error) {
      context.errors[currentNode.id] = error instanceof Error ? error : new Error(String(error));
      console.error(`노드 ${currentNode.id} 실행 중 오류 발생:`, error);
    }
  }

  return {
    success: Object.keys(context.errors).length === 0,
    executionTime: Date.now() - context.startTime,
    nodeResults: context.nodeResults,
  };
}