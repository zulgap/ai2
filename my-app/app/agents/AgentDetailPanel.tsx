'use client';

import { useEffect, useState } from 'react';

interface AgentDetailPanelProps {
  agent: any;
}

export default function AgentDetailPanel({ agent }: AgentDetailPanelProps) {
  const [ragDocs, setRagDocs] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatResult, setChatResult] = useState('');
  const [loading, setLoading] = useState(false);

  // RAG 문서 목록 조회
  useEffect(() => {
    if (!agent?.id) {
      setRagDocs([]);
      return;
    }
    fetch(`/api/agents/${agent.id}/rag-docs`)
      .then(res => res.json())
      .then(setRagDocs)
      .catch(() => setRagDocs([]));
  }, [agent]);

  // AI 채팅 핸들러
  const handleChat = async () => {
    if (!agent?.id || !chatInput) return;
    setLoading(true);
    setChatResult('');
    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await res.json();
      setChatResult(data?.response || JSON.stringify(data));
    } catch {
      setChatResult('AI 응답 실패');
    }
    setLoading(false);
  };

  if (!agent) return null;

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="font-bold mb-2">에이전트 상세: {agent.name}</h2>
      <div>설명: {agent.description}</div>
      <div>역할: {agent.role}</div>
      <div>타입: {agent.type}</div>
      <div>모델: {agent.model}</div>
      <div>온도: {agent.temperature}</div>
      <div>프롬프트: {agent.prompt}</div>
      <h3 className="mt-2 font-semibold">RAG 문서 목록</h3>
      <ul>
        {ragDocs.length > 0 ? (
          ragDocs.map((doc: any) => (
            <li key={doc.id}>
              {doc.name} - {doc.description}
            </li>
          ))
        ) : (
          <li className="text-gray-400 text-sm">등록된 문서가 없습니다.</li>
        )}
      </ul>
      <h3 className="mt-2 font-semibold">AI 채팅</h3>
      <div className="flex gap-2 mb-2">
        <input
          className="border px-2 py-1 flex-1"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="질문을 입력하세요"
          disabled={loading}
        />
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded"
          onClick={handleChat}
          disabled={loading || !chatInput}
        >
          {loading ? '전송 중...' : '전송'}
        </button>
      </div>
      {chatResult && (
        <div className="bg-gray-100 p-2 rounded">{chatResult}</div>
      )}
    </div>
  );
}