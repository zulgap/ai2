'use client';

import { useState } from 'react';

type Node = {
  id: string;
  name: string;
  type: string;
  leaderAgentId?: string;
};

type Props = {
  workflowId: string;
  nodes: Node[];
  agents: { id: string; name: string }[];
  onNodesChange: (nodes: Node[]) => void;
};

export default function NodeEditor({ workflowId, nodes, agents, onNodesChange }: Props) {
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('');
  const [leaderAgentId, setLeaderAgentId] = useState('');
  const [error, setError] = useState('');

  // 노드 추가
  const handleAddNode = async () => {
    if (!nodeName || !nodeType) {
      setError('노드 이름과 타입을 입력하세요.');
      return;
    }
    const res = await fetch(`/api/workflows/${workflowId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nodeName, type: nodeType, leaderAgentId }),
    });
    if (res.ok) {
      const newNode = await res.json();
      onNodesChange([...nodes, newNode]);
      setNodeName('');
      setNodeType('');
      setLeaderAgentId('');
      setError('');
    } else {
      setError('노드 추가 실패');
    }
  };

  // 노드 삭제
  const handleDeleteNode = async (nodeId: string) => {
    const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onNodesChange(nodes.filter(n => n.id !== nodeId));
    } else {
      setError('노드 삭제 실패');
    }
  };

  // 노드 수정(간단 예시)
  // 실제로는 수정 폼/모달을 별도로 구현하는 것이 좋습니다.
  // 아래는 이름/타입만 바꾸는 예시입니다.
  const handleEditNode = async (nodeId: string, name: string, type: string, leaderAgentId?: string) => {
    const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, leaderAgentId }),
    });
    if (res.ok) {
      const updated = await res.json();
      onNodesChange(nodes.map(n => (n.id === nodeId ? updated : n)));
    } else {
      setError('노드 수정 실패');
    }
  };

  // 노드 순서 변경
  const handleChangeOrder = async (nodeId: string, newOrder: number) => {
    const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}/order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    });
    if (res.ok) {
      // 성공 시 노드 목록을 다시 불러오거나 상태를 갱신
    }
  };

  // 노드 분기/병렬(flow) 정보 변경
  const handleChangeFlow = async (nodeId: string, flowData: any) => {
    const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}/flow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowData }),
    });
    if (res.ok) {
      // 성공 시 노드 목록을 다시 불러오거나 상태를 갱신
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">노드 관리</h3>
      <div className="flex gap-2 mb-2">
        <input
          className="border px-2 py-1"
          placeholder="노드 이름"
          value={nodeName}
          onChange={e => setNodeName(e.target.value)}
        />
        <input
          className="border px-2 py-1"
          placeholder="노드 타입"
          value={nodeType}
          onChange={e => setNodeType(e.target.value)}
        />
        <select
          className="border px-2 py-1"
          value={leaderAgentId}
          onChange={e => setLeaderAgentId(e.target.value)}
        >
          <option value="">팀장 선택(선택)</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={handleAddNode} type="button">
          추가
        </button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul>
        {nodes.map(n => (
          <li key={n.id} className="flex items-center gap-2 mb-1">
            <span>{n.name} ({n.type})</span>
            {n.leaderAgentId && <span className="text-xs text-blue-700">팀장: {agents.find(a => a.id === n.leaderAgentId)?.name}</span>}
            <button className="text-red-500 text-xs" onClick={() => handleDeleteNode(n.id)} type="button">
              삭제
            </button>
            {/* 수정 버튼/폼은 필요시 추가 */}
          </li>
        ))}
      </ul>
    </div>
  );
}