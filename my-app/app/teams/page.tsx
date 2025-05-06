"use client";
import React, { useState } from 'react';
import TeamCreateForm from './TeamCreateForm';
import TeamDocumentUpload from './TeamDocumentUpload';
import TeamRelationForm from './TeamRelationForm';

const RELATION_TYPES = [
  { value: 'before-after', label: 'before-after 조건' },
  { value: 'concept-example', label: '개념-예시' },
  { value: 'origin-summary', label: '원문-요약' },
];

export default function TeamsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 팀/브랜드/문서 상태
  const [brands, setBrands] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // 팀 생성 폼
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // 문서 업로드
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDocDescs, setUploadDocDescs] = useState<string[]>([]);

  // 관계 폼
  const [relationFrom, setRelationFrom] = useState('');
  const [relationTo, setRelationTo] = useState('');
  const [relationType, setRelationType] = useState('');
  const [relationPrompt, setRelationPrompt] = useState('');
  const [relations, setRelations] = useState<any[]>([]);

  // 디버깅 메시지 상태
  const [debugMsg, setDebugMsg] = useState<string>('');

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [embedding, setEmbedding] = useState<any>(null);

  // 데이터 불러오기 (브랜드/팀/문서)
  React.useEffect(() => {
    setDebugMsg('브랜드/팀/문서 목록 불러오는 중...');
    fetch('/api/brands')
      .then(res => res.json())
      .then(setBrands)
      .catch(e => setDebugMsg(`브랜드 목록 오류: ${e}`));
    fetch('/api/teams')
      .then(res => res.json())
      .then(setTeams)
      .catch(e => setDebugMsg(`팀 목록 오류: ${e}`));
    if (selectedTeamId) {
      fetch(`/api/teams/documents?teamId=${selectedTeamId}`)
        .then(res => res.json())
        .then(data => setDocuments(Array.isArray(data) ? data : [])) // <-- 여기 수정
        .then(() => setDebugMsg('문서 목록 불러오기 완료'))
        .catch(e => setDebugMsg(`문서 목록 오류: ${e}`));
    } else {
      setDocuments([]);
      setDebugMsg('팀이 선택되지 않음');
    }
  }, [selectedTeamId]);

  // 팀 생성
  const handleCreateTeam = async () => {
    setDebugMsg('팀 생성 요청 중...');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          brandId: selectedBrandId,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setDebugMsg(`팀 생성 실패: ${msg}`);
        return;
      }
      const data = await res.json();
      setSelectedTeamId(data.team.id); // ← 여기서 팀 ID를 세팅!
      setTeams((prev) => [...prev, data.team]);
      setName('');
      setDescription('');
      setCategory('');
      setDebugMsg('팀 생성 성공');
      setStep(2); // 문서 업로드 단계로 이동
    } catch (e) {
      setDebugMsg(`팀 생성 중 오류: ${e}`);
    }
  };

  // 문서 업로드
  const handleUploadWithMeta = async () => {
    setDebugMsg('문서 업로드 시작');
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const desc = uploadDocDescs[i] || '';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('size', file.size.toString());
        formData.append('mimetype', file.type);
        // description을 metadata(guide)로 포함
        formData.append('metadata', JSON.stringify({ guide: desc }));

        // 추가 필드
        if (selectedBrandId) formData.append('brandId', selectedBrandId);
        if (selectedAgentId) formData.append('agentId', selectedAgentId);
        if (selectedWorkflowId) formData.append('workflowId', selectedWorkflowId);
        if (selectedNodeId) formData.append('nodeId', selectedNodeId);
        if (relations && relations.length > 0) formData.append('relations', JSON.stringify(relations));
        if (embedding) formData.append('embedding', JSON.stringify(embedding));
        formData.append('vectorized', 'true'); // 또는 실제 값

        await fetch(`/api/teams/documents?teamId=${selectedTeamId}`, {
          method: 'POST',
          body: formData,
        });
        setDebugMsg(`문서 업로드 완료: ${file.name}`);
      }
      if (selectedTeamId) {
        await fetch(`/api/teams/documents?teamId=${selectedTeamId}`)
          .then(res => res.json())
          .then(data => setDocuments(Array.isArray(data) ? data : []))
          .then(() => setDebugMsg('문서 목록 갱신 완료'))
          .catch(e => setDebugMsg(`문서 목록 갱신 오류: ${e}`));
      }
      setUploadFiles([]);
      setUploadDocDescs([]);
    } catch (e) {
      setDebugMsg(`문서 업로드 오류: ${e}`);
    }
  };

  // 관계 추가/삭제/저장
  const addRelation = () => {
    setDebugMsg('');
    if (!relationFrom || !relationTo || !relationType) {
      setDebugMsg('관계 추가: 필수값 누락');
      return;
    }
    setRelations(prev => [
      ...prev,
      {
        from: relationFrom,
        to: relationTo,
        type: relationType,
        prompt: relationPrompt,
      },
    ]);
    setRelationFrom('');
    setRelationTo('');
    setRelationType('');
    setRelationPrompt('');
    setDebugMsg('관계 추가 완료');
  };

  const removeRelation = (idx: number) => {
    setRelations(prev => prev.filter((_, i) => i !== idx));
    setDebugMsg(`관계 삭제: ${idx}번`);
  };

  const saveRelations = async () => {
    setDebugMsg('관계 저장 시작');
    try {
      for (const rel of relations) {
        const res = await fetch('/api/document-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: rel.from,
            toId: rel.to,
            type: rel.type,
            prompt: rel.prompt,
            brandId: selectedBrandId,
            teamId: selectedTeamId,
          }),
        });
        if (!res.ok) {
          const msg = await res.text();
          setDebugMsg(`관계 저장 실패: ${msg}`);
          return;
        }
      }
      setRelations([]);
      setDebugMsg('관계 저장 완료');
    } catch (e) {
      setDebugMsg(`관계 저장 오류: ${e}`);
    }
  };

  const teamDocs = Array.isArray(documents)
    ? documents.filter((doc: any) => doc.teamId === selectedTeamId)
    : [];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">팀 관리</h1>
      <div className="mb-6">
        <button className={`mr-2 ${step === 1 ? 'font-bold underline' : ''}`} onClick={() => setStep(1)}>1. 팀 생성</button>
        <button className={`mr-2 ${step === 2 ? 'font-bold underline' : ''}`} onClick={() => setStep(2)} disabled={!selectedTeamId}>2. 문서 업로드</button>
        <button className={`${step === 3 ? 'font-bold underline' : ''}`} onClick={() => setStep(3)} disabled={!selectedTeamId}>3. 문서 관계</button>
      </div>
      {debugMsg && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          <b>디버그:</b> {debugMsg}
        </div>
      )}
      {step === 1 && (
        <TeamCreateForm
          brands={brands}
          selectedBrandId={selectedBrandId}
          setSelectedBrandId={setSelectedBrandId}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          category={category}
          setCategory={setCategory}
          onCreate={async () => { await handleCreateTeam(); setStep(2); }}
          disabled={!selectedBrandId}
        />
      )}
      {step === 2 && (
        <TeamDocumentUpload
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
          uploadDocDescs={uploadDocDescs}
          setUploadDocDescs={setUploadDocDescs}
          onUpload={async () => { await handleUploadWithMeta(); setStep(3); }}
          disabled={!uploadFiles.length}
          selectedTeamId={selectedTeamId} // ← 이 부분이 반드시 있어야 합니다!
          setDocuments={setDocuments} // ← 추가
        />
      )}
      {step === 3 && (
        <TeamRelationForm
          documents={teamDocs} // ← 팀에 속한 문서만 전달
          RELATION_TYPES={RELATION_TYPES}
          relationFrom={relationFrom}
          setRelationFrom={setRelationFrom}
          relationTo={relationTo}
          setRelationTo={setRelationTo}
          relationType={relationType}
          setRelationType={setRelationType}
          relationPrompt={relationPrompt}
          setRelationPrompt={setRelationPrompt}
          relations={relations}
          addRelation={addRelation}
          removeRelation={removeRelation}
          saveRelations={saveRelations}
          disabled={relations.length === 0}
          selectedTeamId={selectedTeamId}
        />
      )}
    </div>
  );
}