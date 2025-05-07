'use client';

import { useEffect, useState } from 'react';
import AgentCreateForm from './AgentCreateForm';
import AgentDocumentUpload from './AgentDocumentUpload';
import AgentRelationForm from './AgentRelationForm';

const RELATION_TYPES = [
  { value: 'before-after', label: 'before-after 조건' },
  { value: 'concept-example', label: '개념-예시' },
  { value: 'origin-summary', label: '원문-요약' },
];

export default function AgentsPage() {
  // 단계
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 상태
  const [brands, setBrands] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  // 문서 업로드
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDocDescs, setUploadDocDescs] = useState<string[]>([]);

  // 디버그 메시지
  const [debugMsg, setDebugMsg] = useState<string>('');

  // 브랜드/팀/에이전트/문서 목록 불러오기
  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(setBrands)
      .catch(e => setDebugMsg(`브랜드 목록 오류: ${e}`));
  }, []);
  useEffect(() => {
    if (selectedBrandId) {
      fetch(`/api/teams?brandId=${selectedBrandId}`)
        .then(res => res.json())
        .then(setTeams)
        .catch(e => setDebugMsg(`팀 목록 오류: ${e}`));
    } else {
      setTeams([]);
    }
    setSelectedTeamId('');
    setSelectedAgent(null);
    setAgents([]);
    setDocuments([]);
  }, [selectedBrandId]);
  useEffect(() => {
    if (selectedTeamId) {
      fetch(`/api/agents?teamId=${selectedTeamId}`)
        .then(res => res.json())
        .then(data => setAgents(Array.isArray(data) ? data : data.data || data.agents || []))
        .catch(e => setDebugMsg(`에이전트 목록 오류: ${e}`));
    } else {
      setAgents([]);
      setSelectedAgent(null);
      setDocuments([]);
    }
  }, [selectedTeamId]);
  useEffect(() => {
    if (selectedAgent) {
      fetch(`/api/agents/${selectedAgent.id}/documents`)
        .then(res => res.json())
        .then(data => setDocuments(Array.isArray(data) ? data : []))
        .catch(e => setDebugMsg(`문서 목록 오류: ${e}`));
    } else {
      setDocuments([]);
    }
  }, [selectedAgent]);

  // 에이전트 생성 후 처리
  const handleAgentCreated = () => {
    if (selectedTeamId) {
      fetch(`/api/agents?teamId=${selectedTeamId}`)
        .then(res => res.json())
        .then(data => setAgents(Array.isArray(data) ? data : data.data || data.agents || []));
    }
    setStep(2);
  };

  // 문서 업로드 후 처리
  const handleUpload = async () => {
    if (selectedAgent) {
      await fetch(`/api/agents/${selectedAgent.id}/documents`)
        .then(res => res.json())
        .then(data => setDocuments(Array.isArray(data) ? data : []));
    }
    setUploadFiles([]);
    setUploadDocDescs([]);
    setStep(3);
  };

  // 삭제
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('에이전트 삭제 실패');
      if (selectedAgent?.id === id) setSelectedAgent(null);
      setAgents(agents.filter((a: any) => a.id !== id));
      setDocuments([]);
    } catch (err: any) {
      setDebugMsg(`[에이전트 관리] 에이전트 삭제 에러: ${err?.message || err}`);
    }
  };

  // 문서 목록(선택된 에이전트 기준)
  const agentDocs = Array.isArray(documents)
    ? documents.filter((doc: any) => doc.agentId === selectedAgent?.id)
    : [];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">에이전트 관리</h1>
      <div className="mb-6">
        <button className={`mr-2 ${step === 1 ? 'font-bold underline' : ''}`} onClick={() => setStep(1)}>1. 에이전트 생성</button>
        <button className={`mr-2 ${step === 2 ? 'font-bold underline' : ''}`} onClick={() => setStep(2)} disabled={!selectedAgent}>2. 문서 업로드</button>
        <button className={`${step === 3 ? 'font-bold underline' : ''}`} onClick={() => setStep(3)} disabled={!selectedAgent}>3. 문서 관계</button>
      </div>
      {debugMsg && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          <b>디버그:</b> {debugMsg}
        </div>
      )}
      {step === 1 && (
        <AgentCreateForm
          brands={brands}
          teams={teams}
          selectedBrandId={selectedBrandId}
          setSelectedBrandId={setSelectedBrandId}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          onCreated={handleAgentCreated}
        />
      )}
      {step === 2 && selectedAgent && (
        <AgentDocumentUpload
          agentId={selectedAgent.id}
          teamId={selectedTeamId}
          brandId={selectedBrandId}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
          uploadDocDescs={uploadDocDescs}
          setUploadDocDescs={setUploadDocDescs}
          setDocuments={setDocuments}
          onUpload={handleUpload}
        />
      )}
      {step === 3 && selectedAgent && (
        <AgentRelationForm
          documents={agentDocs}
          RELATION_TYPES={RELATION_TYPES}
          selectedAgentId={selectedAgent.id}
        />
      )}
      {/* 에이전트 목록 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">에이전트 목록</h2>
        <ul>
          {agents.map((agent: any) => (
            <li key={agent.id} className="mb-2 flex items-center gap-2">
              <span
                className="cursor-pointer underline"
                onClick={() => {
                  setSelectedAgent(agent);
                  setStep(2); // 에이전트 선택 시 2단계로 이동
                }}
              >
                {agent.name}
              </span>
              <span className="text-gray-500">{agent.role}</span>
              <span className="text-gray-500">{agent.type}</span>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => handleDelete(agent.id)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}