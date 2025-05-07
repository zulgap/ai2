import React, { useState } from 'react';

export default function TeamRelationForm({
  documents,
  RELATION_TYPES,
  selectedTeamId,
}: any) {
  const [relationFrom, setRelationFrom] = useState('');
  const [relationTo, setRelationTo] = useState('');
  const [relationType, setRelationType] = useState('');
  const [relationPrompt, setRelationPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const teamDocs = Array.isArray(documents)
    ? documents.filter((doc: any) => doc.teamId === selectedTeamId)
    : [];

  // 관계 저장
  const handleSaveRelation = async () => {
    if (!selectedTeamId || !relationFrom || !relationTo || !relationType || !relationPrompt) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const payload = [{
        from: relationFrom,
        to: relationTo,
        type: relationType,
        prompt: relationPrompt,
      }];
      const res = await fetch(`/api/team-documents/${selectedTeamId}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relations: payload, teamId: selectedTeamId }),
      });
      if (!res.ok) {
        alert('관계 저장 실패');
        return;
      }
      // 저장 성공 후 입력란 초기화
      setRelationFrom('');
      setRelationTo('');
      setRelationType('');
      setRelationPrompt('');
      alert('관계가 저장되었습니다.');
    } catch (e) {
      alert('관계 저장 중 오류');
    }
    setLoading(false);
  };

  // 여러 관계 저장
  const handleSaveRelations = async (relations: any[]) => {
    if (!selectedTeamId || !Array.isArray(relations) || relations.length === 0) {
      alert('팀과 관계 목록을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teams/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeamId, relations }),
      });
      if (!res.ok) {
        alert('관계 저장 실패');
        setLoading(false);
        return;
      }
      alert('관계가 저장되었습니다.');
      // 필요시 입력 초기화 등 추가
    } catch (e) {
      alert('관계 저장 중 오류');
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
            {teamDocs.map((doc: any) => (
              <option key={doc.id} value={doc.id}>{doc.title || doc.name}</option>
            ))}
          </select>
          <select
            value={relationTo}
            onChange={e => setRelationTo(e.target.value)}
            className="border px-2 py-1"
          >
            <option value="">To 문서 선택</option>
            {teamDocs.map((doc: any) => (
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
          >
            관계 저장
          </button>
        </div>
      </div>
    </div>
  );
}
