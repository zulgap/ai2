'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react'; // 1. 상단에 추가

type Brand = { id: string; name: string };
type Team = { id: string; name: string };
type Workflow = { id: string; name?: string; team?: Team };
type Agent = { id: string; name: string; type: string; model?: string };
type WorkflowExecution = { id: string; startedAt: string; status: string; output?: any };
type Message = {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  createdAt: string;
  agentId?: string;
  metadata?: any;
};

export default function ChatPage() {
  const { data: session } = useSession(); // 2. 함수 안에 추가

  // 선택 상태
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  // 대화/메시지
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 브랜드 목록 불러오기
  useEffect(() => {
    fetch('/api/brands').then(res => res.json()).then(setBrands);
  }, []);

  // 브랜드 선택 시 워크플로우 목록 불러오기 (워크플로우 이름 없으면 팀명으로 대체)
  useEffect(() => {
    if (!selectedBrandId) {
      setWorkflows([]);
      setSelectedWorkflowId('');
      return;
    }
    fetch(`/api/workflows?brandId=${selectedBrandId}`)
      .then(res => res.json())
      .then((data: any) => {
        const workflows = Array.isArray(data) ? data : [];
        const workflowsWithName = workflows.map(wf => ({
          ...wf,
          name: wf.name && wf.name.trim() !== '' ? wf.name : wf.team?.name || '(이름없음)',
        }));
        setWorkflows(workflowsWithName);
      });
  }, [selectedBrandId]);

  // 워크플로우 선택 시 에이전트/실행이력 불러오기
  useEffect(() => {
    if (!selectedWorkflowId) {
      setAgents([]);
      setExecutions([]);
      setSelectedExecutionId(null);
      return;
    }
    fetch(`/api/workflows/${selectedWorkflowId}/agents`)
      .then(res => res.json())
      .then(setAgents);

    fetch(`/api/workflow-executions?workflowId=${selectedWorkflowId}`)
      .then(async res => {
        if (!res.ok) return [];
        try {
          return await res.json();
        } catch {
          return [];
        }
      })
      .then(setExecutions);
  }, [selectedWorkflowId]);

  // 실행이력 선택 시 메시지 불러오기
  useEffect(() => {
    if (!selectedExecutionId) return setMessages([]);
    fetch(`/api/workflow-executions/${selectedExecutionId}/messages`)
      .then(res => res.json())
      .then(setMessages);
  }, [selectedExecutionId]);

  // 워크플로우 실행 (팀장에이전트가 전체 실행)
  const handleExecuteWorkflow = async () => {

    setSending(true);
    try {
      const res = await fetch(`/api/workflow-executions/${selectedWorkflowId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest' }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert('워크플로우 실행 실패: ' + (err.message || res.status));
        setSending(false);
        return;
      }
      const execution = await res.json();
      setSelectedExecutionId(execution.id);
    } catch (e) {
      alert('워크플로우 실행 중 오류가 발생했습니다.');
    }
    setSending(false);
  };

  // 메시지 전송 (유저→선택한 에이전트)
  const handleSend = async () => {
    if (!input.trim() || !selectedExecutionId || selectedAgentIds.length === 0) return;
    setSending(true);
    for (const agentId of selectedAgentIds) {
      await fetch(`/api/workflow-executions/${selectedExecutionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, agentId }),
      });
    }
    fetch(`/api/workflow-executions/${selectedExecutionId}/messages`)
      .then(res => res.json())
      .then(setMessages);
    setInput('');
    setSending(false);
  };

  // 스크롤 항상 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 에이전트 선택 토글
  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  // 실행이력에서 최종 결과물
  const selectedExecution = executions.find(e => e.id === selectedExecutionId);

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-[90vh]">
      <h1 className="text-2xl font-bold mb-4">워크플로우 멀티에이전트 채팅</h1>
      {/* 상단 선택 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="border px-2 py-1" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)}>
          <option value="">브랜드 선택</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="border px-2 py-1" value={selectedWorkflowId} onChange={e => setSelectedWorkflowId(e.target.value)} disabled={!selectedBrandId}>
          <option value="">워크플로우 선택</option>
          {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name || '(이름없음)'}</option>)}
        </select>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            alert('버튼 클릭됨');
            handleExecuteWorkflow();
          }}
          disabled={!selectedWorkflowId || sending}
        >
          워크플로우 실행(팀장)
        </button>
        <select className="border px-2 py-1" value={selectedExecutionId || ''} onChange={e => setSelectedExecutionId(e.target.value)} disabled={executions.length === 0}>
          <option value="">실행 이력 선택</option>
          {executions.map(e => (
            <option key={e.id} value={e.id}>
              {new Date(e.startedAt).toLocaleString()} - {e.status}
            </option>
          ))}
        </select>
      </div>
      {/* 에이전트 목록 (오른쪽) */}
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col h-[70vh]">
          {/* 메시지/대화창 */}
          <div className="flex-1 overflow-y-auto border rounded p-4 bg-gray-50 mb-2">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-8">메시지가 없습니다.</div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded px-3 py-2 max-w-[70%] ${
                    msg.role === 'USER'
                      ? 'bg-blue-500 text-white'
                      : msg.role === 'ASSISTANT'
                      ? 'bg-white border'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="text-xs mb-1">
                    {msg.role === 'USER'
                      ? '나'
                      : agents.find(a => a.id === msg.agentId)?.name || msg.role}
                    <span className="ml-2 text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* 입력창 */}
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              className="border px-2 py-2 flex-1 rounded"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!selectedExecutionId || sending || selectedAgentIds.length === 0}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              type="submit"
              disabled={!input.trim() || !selectedExecutionId || sending || selectedAgentIds.length === 0}
            >
              전송
            </button>
          </form>
        </div>
        {/* 에이전트 목록 및 선택 */}
        <div className="w-56 border rounded p-3 bg-white h-[70vh] overflow-y-auto">
          <div className="font-semibold mb-2">에이전트 목록</div>
          {agents.map(a => (
            <div key={a.id} className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedAgentIds.includes(a.id)}
                onChange={() => toggleAgent(a.id)}
                id={`agent-${a.id}`}
              />
              <label htmlFor={`agent-${a.id}`} className="cursor-pointer">
                {a.name} <span className="text-xs text-gray-500">({a.type})</span>
              </label>
            </div>
          ))}
          <div className="mt-4 text-xs text-gray-500">
            체크한 에이전트만 채팅에 참여합니다.
          </div>
        </div>
      </div>
      {/* 실행 결과물/이력 */}
      {selectedExecution && (
        <div className="mt-6 border-t pt-4">
          <h2 className="font-semibold mb-2">최종 결과물</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {selectedExecution.output ? JSON.stringify(selectedExecution.output, null, 2) : '아직 결과물이 없습니다.'}
          </pre>
        </div>
      )}
    </div>
  );
}