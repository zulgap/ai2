'use client';

import { useEffect, useState } from 'react';
import NodeEditor from '../components/NodeEditor';

export default function WorkflowDetailPage({ params }: { params: { workflowId: string } }) {
  const { workflowId } = params;
  const [nodes, setNodes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

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

  const fetchChatMessages = async (executionId: string) => {
    try {
      const res = await fetch(`/api/workflow-executions/${executionId}/chat`);
      
      // 404는 정상적인 상황(채팅 내역 없음)으로 처리
      if (res.status === 404) {
        console.log("채팅 내역이 없거나 API가 아직 구현되지 않았습니다.");
        setChatMessages([]);  // 빈 배열로 설정
        return;
      }
      
      // 그 외 오류 처리
      if (!res.ok) {
        throw new Error(`채팅 메시지 조회 실패: ${res.status}`);
      }
      
      const data = await res.json();
      
      // 에러 응답 처리
      if (data.error) {
        console.error("API 오류:", data.error);
        setChatMessages([{ role: 'system', content: `오류가 발생했습니다: ${data.error}` }]);
        return;
      }
      
      // 배열인지 확인 후 처리
      const messages = Array.isArray(data) ? data : [];
      setChatMessages(
        messages.map((m: any) => ({
          role: m.role?.toLowerCase() || 'system',
          content: m.content || '',
          timestamp: m.timestamp
        }))
      );
    } catch (error) {
      console.error('채팅 메시지 불러오기 실패:', error);
      setChatMessages([{ role: 'system', content: '메시지를 불러오는 중 오류가 발생했습니다.' }]);
    }
  };

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