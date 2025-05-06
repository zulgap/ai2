'use client';

import { useEffect, useState } from 'react';

export default function AgentsPage() {
  // 브랜드/팀 상태
  const [brands, setBrands] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // 전체 문서 목록 (팀 전체)
  const [allDocs, setAllDocs] = useState<any[]>([]);
  // 팀의 모든 에이전트가 가진 문서목록
  const [teamDocs, setTeamDocs] = useState<any[]>([]);

  // 에이전트 상태
  const [agents, setAgents] = useState<any[]>([]);
  const [agentForm, setAgentForm] = useState<{
    name: string;
    description: string;
    role: string;
    type: string;
    model: string;
    temperature: number;
    prompt: string;
    ragDocs: string[];
  }>({
    name: '',
    description: '',
    role: 'ASSISTANT',
    type: 'worker',
    model: 'gpt-4',
    temperature: 0.7,
    prompt: '',
    ragDocs: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  // 검색/필터 state
  const [searchRole, setSearchRole] = useState('');
  const [searchType, setSearchType] = useState('');

  // AI 모델 목록 (드랍박스용)
  const [aiModels, setAiModels] = useState<string[]>(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'mistral', 'custom-ai']);

  // 에이전트에 추가할 RAG 문서 선택 상태
  const [selectedRagDocs, setSelectedRagDocs] = useState<any[]>([]);

  // addDocs, setAddDocs 선언 추가 (상단 useState 부분에)
  const [addDocs, setAddDocs] = useState<any[]>([]);

  // 브랜드/팀 목록 조회
  useEffect(() => {
    fetch('/api/brands').then(res => res.json()).then(setBrands);
  }, []);
  useEffect(() => {
    if (selectedBrandId) {
      fetch(`/api/teams?brandId=${selectedBrandId}`).then(res => res.json()).then(setTeams);
    } else {
      setTeams([]);
    }
    setSelectedTeamId('');
  }, [selectedBrandId]);

  // 전체 문서 목록 조회 (팀 기준)
  useEffect(() => {
    if (selectedTeamId) {
      fetch(`/api/documents?teamId=${selectedTeamId}`)
        .then(res => res.json())
        .then(docs => {
          setAllDocs(docs);
        });
    } else {
      setAllDocs([]);
      setTeamDocs([]);
    }
  }, [selectedTeamId]);

  // 팀의 모든 에이전트가 가진 문서목록 집계 함수
  const getTeamDocsFromAgents = (agents: any[], allDocs: any[]) => {
    const docIds = Array.from(
      new Set(
        agents.flatMap(agent => agent.ragDocs?.map((d: any) => d.id) || [])
      )
    );
    return allDocs.filter((doc: any) => docIds.includes(doc.id));
  };

  // teamDocs 관리 useEffect 추가 (팀문서: 모든 에이전트 ragDocs 집계)
  useEffect(() => {
    setTeamDocs(getTeamDocsFromAgents(agents, allDocs));
    // eslint-disable-next-line
  }, [agents, allDocs]);

  // 에이전트 목록 조회 (검색 포함)
  const fetchAgents = async () => {
    if (!selectedTeamId) {
      setAgents([]);
      setTeamDocs([]);
      return;
    }
    const params = new URLSearchParams({
      teamId: selectedTeamId,
      role: searchRole,
      type: searchType,
    }).toString();
    const res = await fetch(`/api/agents?${params}`);
    const agentList = await res.json();
    setAgents(agentList);
  };
  useEffect(() => {
    if (selectedTeamId) fetchAgents();
    else {
      setAgents([]);
      setTeamDocs([]);
    }
    // eslint-disable-next-line
  }, [selectedTeamId, searchRole, searchType]);

  // 검색/필터 핸들러
  const handleSearch = () => {
    fetchAgents();
  };

  // 에이전트 생성
  const handleCreateAgent = async () => {
    if (!agentForm.name || !selectedTeamId) return;

    // 1. 에이전트 먼저 생성
    const agentRes = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...agentForm,
        teamId: selectedTeamId,
        config: {},
        ragDocs: selectedRagDocs.map((d: any) => d.id),
      }),
    });
    const agent = await agentRes.json();

    // 2. addDocs의 파일을 agentId와 함께 서버에 업로드
    for (const doc of addDocs) {
      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('name', doc.name);
      formData.append('description', doc.description);
      formData.append('teamId', selectedTeamId);
      formData.append('agentId', agent.id); // ← 여기서 agentId가 포함됨
      await fetch('/api/documents/upload', { method: 'POST', body: formData });
    }

    // 3. 상태 초기화 및 목록 갱신
    setAgentForm({
      name: '',
      description: '',
      role: 'ASSISTANT',
      type: 'worker',
      model: aiModels[0],
      temperature: 0.7,
      prompt: '',
      ragDocs: [],
    });
    setSelectedRagDocs([]);
    setAddDocs([]);
    fetchAgents();
  };

  // 에이전트 삭제
  const handleDelete = async (id: string) => {
    await fetch(`/api/agents/${id}`, {
      method: 'DELETE',
    });
    if (selectedAgent?.id === id) setSelectedAgent(null);
    fetchAgents();
  };

  // 에이전트 수정 시작
  const startEdit = (agent: any) => {
    setEditingId(agent.id);
    setAgentForm({
      name: agent.name,
      description: agent.description || '',
      role: agent.role || 'ASSISTANT',
      type: agent.type || 'worker',
      model: agent.model || aiModels[0],
      temperature: agent.temperature ?? 0.7,
      prompt: agent.prompt || '',
      ragDocs: agent.ragDocs ? agent.ragDocs.map((d: any) => d.id) : [],
    });
    // 에이전트의 ragDocs(문서ID 배열)로 실제 문서 정보 매핑
    if (agent.ragDocs && Array.isArray(agent.ragDocs)) {
      setSelectedRagDocs(
        allDocs.filter((doc: any) => agent.ragDocs.some((d: any) => d.id === doc.id))
      );
    } else {
      setSelectedRagDocs([]);
    }
  };

  // 에이전트 수정 저장
  const handleUpdate = async () => {
    if (!editingId) return;
    await fetch(`/api/agents/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...agentForm,
        teamId: agentForm.type.startsWith('leader') || agentForm.type === 'worker' ? selectedTeamId : undefined,
        ragDocs: selectedRagDocs.map((d: any) => d.id),
      }),
    });
    setEditingId(null);
    setAgentForm({
      name: '',
      description: '',
      role: 'ASSISTANT',
      type: 'worker',
      model: aiModels[0],
      temperature: 0.7,
      prompt: '',
      ragDocs: [],
    });
    setSelectedRagDocs([]);
    fetchAgents();
  };

  // 에이전트 복제
  const handleClone = async (agent: any) => {
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...agent,
        name: agent.name + ' (복제)',
      }),
    });
    fetchAgents();
  };

  // RAG 문서 상세 조회 (선택된 에이전트)
  const [ragDocs, setRagDocs] = useState<any[]>([]);
  const fetchRagDocs = async (agentId: string) => {
    const res = await fetch(`/api/agents/${agentId}/rag-docs`);
    setRagDocs(await res.json());
  };
  useEffect(() => {
    if (selectedAgent?.id) {
      fetchRagDocs(selectedAgent.id);
    } else {
      setRagDocs([]);
    }
  }, [selectedAgent]);

  // 에이전트 AI 채팅 예시
  const [chatInput, setChatInput] = useState('');
  const [chatResult, setChatResult] = useState('');
  const handleChat = async () => {
    if (!selectedAgent?.id || !chatInput) return;
    const res = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatInput }),
    });
    const data = await res.json();
    setChatResult(data?.response || JSON.stringify(data));
  };

  // RAG 문서 추가 모달 상태
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMsg, setDocMsg] = useState('');

  // 문서간 관계 상태
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [relations, setRelations] = useState<{[key: string]: string}>({}); // "docId1-docId2": "관계설명"

  // 문서 추가 핸들러 (임시 저장)
  const handleAddDocTemp = () => {
    if (!docName || !docFile) return;
    setAddDocs(prev => [...prev, { name: docName, description: docDesc, file: docFile, id: Math.random().toString(36).slice(2) }]);
    setDocName('');
    setDocDesc('');
    setDocFile(null);
  };

  // 문서 업로드 (최종 서버 전송)
  const handleUploadDocs = () => {
    setShowAddDocModal(false);
    // addDocs는 이미 임시로 쌓여있으므로 별도 처리 불필요
    setDocName('');
    setDocDesc('');
    setDocFile(null);
  };

  // 관계 그룹핑 유틸
  function getRelationGroups(docs: any[], relations: {[key: string]: string}) {
    // 간단한 2개 문서간 관계만 그룹핑 (확장 필요시 union-find 등 사용)
    const groups: any[] = [];
    const used = new Set();
    Object.keys(relations).forEach(key => {
      const [id1, id2] = key.split('-');
      if (!used.has(id1) && !used.has(id2)) {
        groups.push({
          docs: [docs.find(d => d.id === id1), docs.find(d => d.id === id2)],
          relation: relations[key],
        });
        used.add(id1);
        used.add(id2);
      }
    });
    // 나머지 단독 문서
    docs.forEach(doc => {
      if (!used.has(doc.id)) {
        groups.push({ docs: [doc], relation: null });
      }
    });
    return groups;
  }

  // 체크박스 선택 핸들러
  const handleCheckDoc = (docId: string) => {
    setCheckedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // 관계 필드 입력 핸들러
  const handleRelationChange = (key: string, value: string) => {
    setRelations(prev => ({ ...prev, [key]: value }));
  };

  // 문서 추가 핸들러
  const handleAddDoc = async () => {
    if (!docFile || !selectedTeamId) return;
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('name', docName || docFile.name);
    formData.append('description', docDesc);
    formData.append('teamId', selectedTeamId);
    setDocMsg('');
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setDocMsg('업로드 성공!');
        fetch(`/api/documents?teamId=${selectedTeamId}`)
          .then(res => res.json())
          .then(setAllDocs);
        setShowAddDocModal(false);
        setDocName('');
        setDocDesc('');
        setDocFile(null);
      } else {
        setDocMsg('업로드 실패');
      }
    } catch {
      setDocMsg('업로드 실패');
    }
  };

  // RAG 문서 목록에서 "추가" 버튼 클릭 시
  const handleSelectRagDoc = (doc: any) => {
    if (!selectedRagDocs.find((d: any) => d.id === doc.id)) {
      setSelectedRagDocs((prev) => [...prev, doc]);
    }
  };

  // RAG 문서 목록에서 "제거" 버튼 클릭 시
  const handleRemoveRagDoc = (docId: string) => {
    setSelectedRagDocs((prev) => prev.filter((d: any) => d.id !== docId));
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">에이전트 관리</h1>

      {/* 브랜드/팀 선택 */}
      <div className="flex gap-2 mb-4">
        <select
          className="border px-2 py-1"
          value={selectedBrandId}
          onChange={e => setSelectedBrandId(e.target.value)}
        >
          <option value="">브랜드 선택</option>
          {brands.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="border px-2 py-1"
          value={selectedTeamId}
          onChange={e => setSelectedTeamId(e.target.value)}
          disabled={!selectedBrandId}
        >
          <option value="">팀 선택</option>
          {teams.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* 검색/필터 UI */}
      <div className="flex gap-2 mb-4">
        <select
          className="border px-2 py-1"
          value={searchRole}
          onChange={e => setSearchRole(e.target.value)}
        >
          <option value="">전체 역할</option>
          <option value="ASSISTANT">ASSISTANT</option>
          <option value="USER">USER</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
        <select
          className="border px-2 py-1"
          value={searchType}
          onChange={e => setSearchType(e.target.value)}
        >
          <option value="">전체 타입</option>
          <option value="leader-single">팀장(싱글)</option>
          <option value="leader-multi">팀장(멀티)</option>
          <option value="worker">팀원</option>
        </select>
        <button
          className="bg-gray-200 px-2 py-1 rounded"
          onClick={handleSearch}
        >
          검색
        </button>
      </div>

      {/* 에이전트 목록 */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">에이전트 목록</h2>
        <ul>
          {agents.map((agent: any) => (
            <li key={agent.id} className="mb-2 flex items-center gap-2">
              <span
                className="cursor-pointer underline"
                onClick={() => setSelectedAgent(agent)}
              >
                {agent.name}
              </span>
              <span className="text-gray-500">{agent.role}</span>
              <span className="text-gray-500">{agent.type}</span>
              <button
                className="bg-yellow-400 px-2 py-1 rounded"
                onClick={() => startEdit(agent)}
              >
                수정
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => handleDelete(agent.id)}
              >
                삭제
              </button>
              <button
                className="bg-blue-300 px-2 py-1 rounded"
                onClick={() => handleClone(agent)}
              >
                복제
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 팀 문서 목록 (팀 전체 에이전트 ragDocs 집계) */}
      <div className="mb-4">
        <div className="font-semibold mb-1">팀 문서 목록</div>
        <ul>
          {teamDocs.length > 0 ? (
            teamDocs.map(doc => (
              <li key={doc.id}>
                <span className="font-semibold">{doc.name}</span>
                {doc.description && <span className="text-gray-500 ml-2">{doc.description}</span>}
              </li>
            ))
          ) : (
            <li className="text-gray-400 text-sm">등록된 문서가 없습니다.</li>
          )}
        </ul>
      </div>

      {/* 에이전트 생성/수정 폼 */}
      <div className="mb-6 flex flex-col gap-2 max-w-xl">
        <input
          className="border px-2 py-1"
          placeholder="에이전트 이름"
          value={agentForm.name}
          onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))}
        />
        <textarea
          className="border px-2 py-1"
          placeholder="설명"
          value={agentForm.description}
          onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))}
        />
        <select
          className="border px-2 py-1"
          value={agentForm.role}
          onChange={e => setAgentForm(f => ({ ...f, role: e.target.value }))}
        >
          <option value="ASSISTANT">ASSISTANT</option>
          <option value="USER">USER</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
        <select
          className="border px-2 py-1"
          value={agentForm.type}
          onChange={e => setAgentForm(f => ({ ...f, type: e.target.value }))}
        >
          <option value="leader-single">팀장(싱글)</option>
          <option value="leader-multi">팀장(멀티)</option>
          <option value="worker">팀원</option>
        </select>
        {/* AI 모델 드랍박스 */}
        <select
          className="border px-2 py-1"
          value={agentForm.model}
          onChange={e => setAgentForm(f => ({ ...f, model: e.target.value }))}
        >
          {aiModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <input
          className="border px-2 py-1"
          type="number"
          step="0.01"
          min="0"
          max="2"
          placeholder="Temperature"
          value={agentForm.temperature}
          onChange={e => setAgentForm(f => ({ ...f, temperature: Number(e.target.value) }))}
        />
        <textarea
          className="border px-2 py-1"
          placeholder="프롬프트"
          value={agentForm.prompt}
          onChange={e => setAgentForm(f => ({ ...f, prompt: e.target.value }))}
        />

        {/* === 에이전트 문서 추가 버튼 === */}
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs mb-2"
          onClick={() => setShowAddDocModal(true)}
          disabled={!selectedTeamId}
        >
          에이전트 문서 추가
        </button>

        {/* === 에이전트 문서 목록 === */}
        <div className="mb-4">
          <div className="font-semibold mb-1">에이전트 문서 목록</div>
          <ul>
            {editingId
              ? (
                selectedRagDocs.length > 0
                  ? selectedRagDocs.map(doc => (
                      <li key={doc.id} className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{doc.name}</span>
                        <span className="text-gray-500">{doc.description}</span>
                        {/* 필요시 삭제/관계정보 */}
                      </li>
                    ))
                  : <li className="text-gray-400 text-sm">등록된 문서가 없습니다.</li>
              )
              : (
                addDocs.length > 0
                  ? addDocs.map(doc => (
                      <li key={doc.id} className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{doc.name}</span>
                        <input
                          className="border px-1 py-0.5 text-xs"
                          placeholder="관계정보"
                          value={relations[doc.id] || ''}
                          onChange={e => setRelations(prev => ({ ...prev, [doc.id]: e.target.value }))}
                          style={{ width: 100 }}
                        />
                        <button
                          className="text-xs text-red-500"
                          onClick={() => setAddDocs(prev => prev.filter((d: any) => d.id !== doc.id))}
                        >
                          삭제
                        </button>
                      </li>
                    ))
                  : <li className="text-gray-400 text-sm">등록된 문서가 없습니다.</li>
              )
            }
          </ul>
        </div>

        {/* === 에이전트 생성/수정 버튼 === */}
        {editingId ? (
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-3 py-1 rounded mt-2"
              onClick={handleUpdate}
              disabled={!selectedTeamId}
            >
              저장
            </button>
            <button
              className="bg-gray-300 px-3 py-1 rounded mt-2"
              onClick={() => {
                setEditingId(null);
                setAgentForm({
                  name: '',
                  description: '',
                  role: 'ASSISTANT',
                  type: 'worker',
                  model: aiModels[0],
                  temperature: 0.7,
                  prompt: '',
                  ragDocs: [],
                });
                setSelectedRagDocs([]);
                fetchAgents();
              }}
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded mt-2 flex-1"
              onClick={handleCreateAgent}
              disabled={!selectedTeamId}
            >
              에이전트 생성
            </button>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded mt-2 flex-1"
              onClick={async () => {
                // 팀 생성완료 로직
                const hasLeader = agents.some(
                  (a: any) => a.type === 'leader-single' || agentForm.type === 'leader-single'
                );
                if (!hasLeader) {
                  alert('팀에 싱글팀장이 최소 1명 필요합니다.');
                  return;
                }
                alert('팀 생성이 완료되었습니다!');
              }}
              disabled={!selectedTeamId}
            >
              팀 생성완료
            </button>
          </div>
        )}
        {!selectedTeamId && (
          <div className="text-red-500 text-sm">브랜드와 팀을 먼저 선택하세요.</div>
        )}
      </div>

      {/* 에이전트 상세 및 RAG 문서/AI 채팅 */}
      {selectedAgent && (
        <div className="p-4 border rounded mb-4">
          <h2 className="font-bold mb-2">에이전트 상세: {selectedAgent.name}</h2>
          <div>설명: {selectedAgent.description}</div>
          <div>역할: {selectedAgent.role}</div>
          <div>타입: {selectedAgent.type}</div>
          <div>모델: {selectedAgent.model}</div>
          <div>온도: {selectedAgent.temperature}</div>
          <div>프롬프트: {selectedAgent.prompt}</div>
          <h3 className="mt-2 font-semibold">RAG 문서 목록</h3>
          <ul>
            {ragDocs.map((doc: any) => (
              <li key={doc.id}>
                {doc.name} - {doc.description}
              </li>
            ))}
          </ul>
          <h3 className="mt-2 font-semibold">AI 채팅</h3>
          <div className="flex gap-2 mb-2">
            <input
              className="border px-2 py-1 flex-1"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="질문을 입력하세요"
            />
            <button
              className="bg-blue-500 text-white px-2 py-1 rounded"
              onClick={handleChat}
            >
              전송
            </button>
          </div>
          {chatResult && (
            <div className="bg-gray-100 p-2 rounded">{chatResult}</div>
          )}
        </div>
      )}

      {/* 문서 추가 모달 */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[350px] max-w-md">
            <h2 className="font-bold mb-4 text-lg">에이전트 문서 추가</h2>
            {/* 문서명 입력란 제거 */}
            <input
              className="border px-2 py-1 mb-2 w-full"
              value={docDesc}
              onChange={e => setDocDesc(e.target.value)}
              placeholder="문서 설명"
            />
            <input
              type="file"
              className="mb-2"
              onChange={e => setDocFile(e.target.files?.[0] || null)}
            />
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded mb-2 w-full"
              onClick={() => {
                if (!docFile) return;
                setAddDocs(prev => [
                  ...prev,
                  {
                    description: docDesc,
                    file: docFile,
                    id: Math.random().toString(36).slice(2),
                    name: docFile.name, // 파일명 사용
                  },
                ]);
                setDocDesc('');
                setDocFile(null);
                setShowAddDocModal(false);
              }}
              disabled={!docFile}
            >
              문서 임시 추가
            </button>
            <button
              className="bg-gray-300 px-3 py-1 rounded w-full"
              onClick={() => {
                setShowAddDocModal(false);
                setDocDesc('');
                setDocFile(null);
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}