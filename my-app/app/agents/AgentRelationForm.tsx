import React, { useState } from 'react';

export interface AgentRelationFormProps {
  documents: any[];
  RELATION_TYPES: { value: string; label: string }[];
  selectedAgentId: string;
  onRelationsSaved?: () => void;
}

export default function AgentRelationForm({
  documents,
  RELATION_TYPES,
  selectedAgentId,
  onRelationsSaved,
}: AgentRelationFormProps) {
  const [relationFrom, setRelationFrom] = useState('');
  const [relationTo, setRelationTo] = useState('');
  const [relationType, setRelationType] = useState('');
  const [relationPrompt, setRelationPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const agentDocs = Array.isArray(documents)
    ? documents.filter((doc: any) => doc.agentId === selectedAgentId)
    : [];

  const handleSaveRelation = async () => {
    if (!selectedAgentId || !relationFrom || !relationTo || !relationType || !relationPrompt) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      // 단일 관계 저장: /api/document-relations로 POST
      const payload = {
        fromId: relationFrom,
        toId: relationTo,
        type: relationType,
        prompt: relationPrompt,
        agentId: selectedAgentId,
      };
      const res = await fetch('/api/document-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `관계 저장 실패 (HTTP ${res.status})`;
        try {
          const err = await res.json();
          msg += err?.error ? `: ${err.error}` : '';
        } catch {
          // ignore
        }
        alert(msg + '\n\n가능한 원인:\n'
          + '- API 라우트 파일이 없음\n'
          + '- 백엔드에 해당 엔드포인트가 없음\n'
          + '- 포트/호스트 불일치\n'
          + '- 서버가 꺼져 있음\n'
          + '- 경로 오타 또는 파라미터 미치환 오류\n'
          + '- 네트워크/프록시 문제');
        setLoading(false);
        return;
      }
      setRelationFrom('');
      setRelationTo('');
      setRelationType('');
      setRelationPrompt('');
      alert('관계가 저장되었습니다.');
      if (onRelationsSaved) onRelationsSaved();
    } catch (e: any) {
      alert('관계 저장 중 네트워크 오류 또는 서버 에러: ' + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="font-bold mb-4 text-lg">3. 문서 관계 입력 및 저장</h2>
      <div className="mb-2">
        <label className="font-semibold">문서 간 관계 입력</label>
        <div className="flex gap-2 mb-2">
          <select
            value={relationFrom}
            onChange={e => setRelationFrom(e.target.value)}
            className="border px-2 py-1"
          >
            <option value="">From 문서 선택</option>
            {agentDocs.map((doc: any) => (
              <option key={doc.id} value={doc.id}>{doc.title || doc.name}</option>
            ))}
          </select>
          <select
            value={relationTo}
            onChange={e => setRelationTo(e.target.value)}
            className="border px-2 py-1"
          >
            <option value="">To 문서 선택</option>
            {agentDocs.map((doc: any) => (
              <option key={doc.id} value={doc.id}>{doc.title || doc.name}</option>
            ))}
          </select>
          <select
            value={relationType}
            onChange={e => setRelationType(e.target.value)}
            className="border px-2 py-1"
          >
            <option value="">관계 유형 선택</option>
            {RELATION_TYPES.map((rt: any) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          <input
            className="border px-2 py-1"
            placeholder="관계 설명"
            value={relationPrompt}
            onChange={e => setRelationPrompt(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            onClick={handleSaveRelation}
            disabled={loading}
            type="button"
          >
            관계 저장
          </button>
        </div>
      </div>
    </div>
  );
}