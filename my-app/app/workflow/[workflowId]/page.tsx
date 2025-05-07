'use client';

import { useEffect, useState } from 'react';
import NodeEditor from '../components/NodeEditor';

export default function WorkflowDetailPage({ params }: { params: { workflowId: string } }) {
  const { workflowId } = params;
  const [nodes, setNodes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // 노드 목록 불러오기
  useEffect(() => {
    fetch(`/api/workflows/${workflowId}/nodes`)
      .then(res => res.json())
      .then(data => setNodes(data.nodes || []));
    // 에이전트 목록도 필요시 불러오기
    fetch('/api/agents')
      .then(res => res.json())
      .then(setAgents);
  }, [workflowId]);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">워크플로우 상세</h1>
      <NodeEditor
        workflowId={workflowId}
        nodes={nodes}
        agents={agents}
        onNodesChange={setNodes}
      />
    </div>
  );
}