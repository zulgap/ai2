'use client';

import { useEffect, useState } from 'react';

type Brand = { id: string; name: string };
type Team = { id: string; name: string };
type Agent = { id: string; name: string; type: string };
type Node = { id: string; name: string; type: string; leaderAgentId?: string };

export default function WorkflowPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [teamLeaderType, setTeamLeaderType] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [leaderAgentId, setLeaderAgentId] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('');
  const [nodeLeaderAgentId, setNodeLeaderAgentId] = useState('');
  const [executedResult, setExecutedResult] = useState<any[] | null>(null);

  // 채팅 관련 state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  // 워크플로우 목록/이력/상세/알림
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [editWorkflowName, setEditWorkflowName] = useState('');
  const [editWorkflowDesc, setEditWorkflowDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 워크플로우 목록 조회
  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(setWorkflows);
  }, []);

  // 브랜드 목록 조회
  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(setBrands);
  }, []);

  // 팀 목록 조회
  useEffect(() => {
    if (!selectedBrandId) {
      setTeams([]);
      return;
    }
    fetch(`/api/teams?brandId=${selectedBrandId}`)
      .then(res => res.json())
      .then(setTeams);
  }, [selectedBrandId]);

  // 에이전트 목록 조회
  useEffect(() => {
    if (!selectedTeamId) {
      setAgents([]);
      return;
    }
    fetch(`/api/agents?teamId=${selectedTeamId}`)
      .then(res => res.json())
      .then(setAgents);
  }, [selectedTeamId]);

  // 워크플로우 실행 이력 조회
  const fetchWorkflowHistory = async (workflowId: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/workflows/${workflowId}/executions`);
      if (!res.ok) throw new Error('이력 조회 실패');
      setWorkflowHistory(await res.json());
    } catch {
      setErrorMsg('워크플로우 실행 이력 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 노드 추가
  const handleAddNode = () => {
    if (!nodeName || !nodeType) {
      setErrorMsg('노드 이름과 타입을 입력하세요.');
      return;
    }
    setNodes([
      ...nodes,
      {
        id: Math.random().toString(36).slice(2),
        name: nodeName,
        type: nodeType,
        leaderAgentId: teamLeaderType === 'MULTI' ? nodeLeaderAgentId : undefined,
      },
    ]);
    setNodeName('');
    setNodeType('');
    setNodeLeaderAgentId('');
    setErrorMsg('');
  };

  // 노드 삭제
  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  // 예시: 로그인된 사용자 정보에서 userId를 가져온다고 가정
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  // 워크플로우 생성
  const handleCreateWorkflow = async () => {
    if (!selectedBrandId || !selectedTeamId || !workflowName) {
      setErrorMsg('브랜드, 팀, 워크플로우 이름을 모두 입력하세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const body = {
        brandId: selectedBrandId,
        teamId: selectedTeamId,
        name: workflowName,
        description: workflowDesc,
        isPublic,
        teamLeaderType,
        leaderAgentId: teamLeaderType === 'SINGLE' ? leaderAgentId : undefined,
        userId, // ← 반드시 포함
        nodes: nodes.map(n => ({
          name: n.name,
          type: n.type,
          leaderAgentId: teamLeaderType === 'MULTI' ? n.leaderAgentId : undefined,
        })),
      };
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('생성 실패');
      setSuccessMsg('워크플로우가 생성되었습니다.');
      fetch('/api/workflows')
        .then(res => res.json())
        .then(setWorkflows);
      setWorkflowName('');
      setWorkflowDesc('');
      setIsPublic(false);
      setTeamLeaderType('SINGLE');
      setLeaderAgentId('');
      setNodes([]);
    } catch {
      setErrorMsg('워크플로우 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  // 워크플로우 수정
  const handleEditWorkflow = (wf: any) => {
    setEditingWorkflow(wf);
    setEditWorkflowName(wf.name);
    setEditWorkflowDesc(wf.description || '');
    setEditIsPublic(!!wf.isPublic);
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/workflows/${editingWorkflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editWorkflowName,
          description: editWorkflowDesc,
          isPublic: editIsPublic,
        }),
      });
      if (!res.ok) throw new Error('수정 실패');
      setSuccessMsg('워크플로우가 수정되었습니다.');
      setEditingWorkflow(null);
      fetch('/api/workflows')
        .then(res => res.json())
        .then(setWorkflows);
    } catch {
      setErrorMsg('워크플로우 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  // 워크플로우 삭제
  const handleDeleteWorkflow = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setSuccessMsg('워크플로우가 삭제되었습니다.');
      fetch('/api/workflows')
        .then(res => res.json())
        .then(setWorkflows);
    } catch {
      setErrorMsg('워크플로우 삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  // 워크플로우 상세 모달
  const openWorkflowDetail = (wf: any) => {
    setSelectedWorkflow(wf);
    fetchWorkflowHistory(wf.id);
  };

  const closeWorkflowDetail = () => {
    setSelectedWorkflow(null);
    setWorkflowHistory([]);
  };

  // 워크플로우 실행
  const [executeWorkflowId, setExecuteWorkflowId] = useState('');
  const [executeInput, setExecuteInput] = useState('');
  const handleExecuteWorkflow = async () => {
    if (!executeWorkflowId) {
      setErrorMsg('실행할 워크플로우를 선택하세요.');
      return;
    }
    setExecutedResult(null);
    setShowChat(false);
    setChatMessages([]);
    setCurrentExecutionId(null);
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    let parsedInput: any = {};
    if (executeInput) {
      try {
        parsedInput = JSON.parse(executeInput);
      } catch {
        setErrorMsg('입력값은 JSON 형식이어야 합니다.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/workflows/${executeWorkflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: parsedInput }), // userId 제거
      });
      const data = await res.json();
      const executionId = data.executionId || data.id || null;
      setCurrentExecutionId(executionId);
      setChatMessages([
        { role: 'system', content: '워크플로우 실행이 시작되었습니다.' },
        { role: 'assistant', content: JSON.stringify(data, null, 2) },
      ]);
      setShowChat(true);
      setExecutedResult(data);
      setSuccessMsg('워크플로우 실행 성공');
    } catch {
      setErrorMsg('워크플로우 실행 실패');
    } finally {
      setLoading(false);
    }
  };

  // 워크플로우 실행 이력의 대화 불러오기 (executionId 기준)
  const fetchConversation = async (executionId: string) => {
    const res = await fetch(`/api/workflow-executions/${executionId}/conversations`);
    const conversations = await res.json();
    if (conversations.length > 0 && conversations[0].messages) {
      setChatMessages(conversations[0].messages.map((m: any) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      })));
    }
  };

  // 채팅 전송 (워크플로우 실행 이력에 메시지 추가)
  const handleSendChat = async () => {
    if (!chatInput || !currentExecutionId) return;
    const res = await fetch(`/api/workflow-executions/${currentExecutionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatInput }),
    });
    const data = await res.json();
    setChatMessages([
      ...chatMessages,
      { role: 'user', content: chatInput },
      { role: 'assistant', content: data.response || JSON.stringify(data) },
    ]);
    setChatInput('');
  };

  // 워크플로우 실행 상태 업데이트
  const handleUpdateExecutionStatus = async (executionId: string, status: 'RUNNING' | 'COMPLETED' | 'FAILED', error?: string) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/workflow-executions/${executionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, error }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      setSuccessMsg('실행 상태가 변경되었습니다.');
      // 필요시 실행 이력 새로고침
      if (selectedWorkflow) fetchWorkflowHistory(selectedWorkflow.id);
    } catch {
      setErrorMsg('실행 상태 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  // 팀장/팀원 구분
  const leaderAgents = agents.filter(a => a.type === 'leader-single' || a.type === 'leader-multi');
  const workerAgents = agents.filter(a => a.type === 'worker');

  // 필수 입력값 체크
  const isCreateDisabled =
    !workflowName || !selectedTeamId || (teamLeaderType === 'SINGLE' && !leaderAgentId);

  return (
    <div className="p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-blue-700">워크플로우 관리</h1>

      {/* 알림/로딩 */}
      {loading && <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">로딩 중...</div>}
      {errorMsg && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}
      {successMsg && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}

      {/* 워크플로우 생성/수정 카드 */}
      {!showChat && (
        <div className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">워크플로우 생성</h2>
          {/* 브랜드/팀 선택 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="font-semibold mr-2">브랜드<span className="text-red-500">*</span></label>
              <select
                className="border px-2 py-1 w-full"
                value={selectedBrandId}
                onChange={e => {
                  setSelectedBrandId(e.target.value);
                  setSelectedTeamId('');
                  setAgents([]);
                }}
              >
                <option value="">브랜드 선택</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="font-semibold mr-2">팀<span className="text-red-500">*</span></label>
              <select
                className="border px-2 py-1 w-full"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                disabled={!selectedBrandId}
              >
                <option value="">팀 선택</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* 에이전트 목록 */}
          {selectedTeamId && (
            <div className="mb-4">
              <div className="mb-2 font-semibold">에이전트 목록</div>
              <div className="flex gap-8">
                <div>
                  <div className="text-blue-700 font-semibold mb-1">팀장</div>
                  <ul>
                    {agents.filter(a => a.type.startsWith('leader')).map(a => (
                      <li key={a.id}>{a.name} ({a.type})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-gray-700 font-semibold mb-1">팀원</div>
                  <ul>
                    {agents.filter(a => a.type === 'worker').map(a => (
                      <li key={a.id}>{a.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* 워크플로우 정보 입력 */}
          <div className="mb-4">
            <input
              className="border px-2 py-1 w-full mb-2"
              placeholder="워크플로우 이름 *"
              value={workflowName}
              onChange={e => setWorkflowName(e.target.value)}
            />
            <textarea
              className="border px-2 py-1 w-full mb-2"
              placeholder="설명"
              value={workflowDesc}
              onChange={e => setWorkflowDesc(e.target.value)}
            />
            <label className="mr-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              /> 공개 워크플로우
            </label>
          </div>
          {/* 팀장 타입/에이전트 선택 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="font-semibold mr-2">팀장 타입</label>
              <select
                className="border px-2 py-1 w-full"
                value={teamLeaderType}
                onChange={e => setTeamLeaderType(e.target.value as 'SINGLE' | 'MULTI')}
              >
                <option value="SINGLE">싱글(한 명의 팀장)</option>
                <option value="MULTI">멀티(노드별 팀장)</option>
              </select>
            </div>
            {teamLeaderType === 'SINGLE' && (
              <div className="flex-1">
                <label className="font-semibold mr-2">팀장 에이전트<span className="text-red-500">*</span></label>
                <select
                  className="border px-2 py-1 w-full"
                  value={leaderAgentId}
                  onChange={e => setLeaderAgentId(e.target.value)}
                >
                  <option value="">팀장 선택</option>
                  {agents.filter(a => a.type.startsWith('leader')).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* 노드 구성 */}
          <div className="mb-4 border rounded p-4 bg-gray-50">
            <div className="font-semibold mb-2">노드 구성</div>
            <div className="flex gap-2 mb-2">
              <input
                className="border px-2 py-1"
                placeholder="노드 이름 *"
                value={nodeName}
                onChange={e => setNodeName(e.target.value)}
              />
              <input
                className="border px-2 py-1"
                placeholder="노드 타입 *"
                value={nodeType}
                onChange={e => setNodeType(e.target.value)}
              />
              {teamLeaderType === 'MULTI' && (
                <select
                  className="border px-2 py-1"
                  value={nodeLeaderAgentId}
                  onChange={e => setNodeLeaderAgentId(e.target.value)}
                >
                  <option value="">팀장 선택</option>
                  {agents.filter(a => a.type.startsWith('leader')).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={handleAddNode}
                type="button"
              >
                노드 추가
              </button>
            </div>
            <ul>
              {nodes.map(n => (
                <li key={n.id} className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{n.name}</span>
                  <span className="text-xs text-gray-500">({n.type})</span>
                  {teamLeaderType === 'MULTI' && n.leaderAgentId && (
                    <span className="text-xs text-blue-700">
                      팀장: {agents.find(a => a.id === n.leaderAgentId)?.name || '선택안됨'}
                    </span>
                  )}
                  <button
                    className="text-red-500 text-xs hover:underline"
                    onClick={() => handleRemoveNode(n.id)}
                    type="button"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* 워크플로우 생성 버튼 */}
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${isCreateDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            onClick={handleCreateWorkflow}
            disabled={isCreateDisabled}
            type="button"
          >
            워크플로우 생성
          </button>
          {isCreateDisabled && (
            <div className="text-red-500 text-sm mt-2">필수 입력값을 모두 입력하세요.</div>
          )}
        </div>
      )}

      {/* 워크플로우 목록 카드 */}
      <div className="bg-white rounded shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">워크플로우 목록</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">이름</th>
              <th className="py-2 text-left">설명</th>
              <th className="py-2 text-left">공개</th>
              <th className="py-2 text-left">액션</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map(wf => (
              <tr key={wf.id} className="border-b hover:bg-gray-50">
                <td>
                  <span
                    className="font-semibold cursor-pointer underline"
                    onClick={() => openWorkflowDetail(wf)}
                    title="상세 보기"
                  >
                    {wf.name}
                  </span>
                </td>
                <td>{wf.description}</td>
                <td>{wf.isPublic ? '공개' : '비공개'}</td>
                <td>
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => {
                      setExecuteWorkflowId(wf.id);
                      setWorkflowName(wf.name);
                    }}
                  >실행</button>
                  <button
                    className="text-green-600 hover:underline mr-2"
                    onClick={() => handleEditWorkflow(wf)}
                  >수정</button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteWorkflow(wf.id)}
                  >삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 워크플로우 실행 카드 */}
      {!showChat && (
        <div className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">워크플로우 실행</h2>
          <input
            className="border px-2 py-1 mb-2 w-full"
            placeholder="실행할 워크플로우 ID 입력"
            value={executeWorkflowId}
            onChange={e => setExecuteWorkflowId(e.target.value)}
          />
          <textarea
            className="border px-2 py-1 mb-2 w-full"
            placeholder="입력값 (JSON 형식)"
            value={executeInput}
            onChange={e => setExecuteInput(e.target.value)}
          />
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${!executeWorkflowId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            onClick={handleExecuteWorkflow}
            disabled={!executeWorkflowId}
            type="button"
          >
            워크플로우 실행
          </button>
          {executedResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">실행 결과</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(executedResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 워크플로우 상세 모달 */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px] max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={closeWorkflowDetail}
            >✕</button>
            <h2 className="text-lg font-bold mb-2">{selectedWorkflow.name}</h2>
            <div className="mb-2"><strong>설명:</strong> {selectedWorkflow.description || '-'}</div>
            <div className="mb-2"><strong>공개여부:</strong> {selectedWorkflow.isPublic ? '공개' : '비공개'}</div>
            <div className="mb-2"><strong>노드:</strong>
              <ul className="list-disc ml-5">
                {(selectedWorkflow.nodes || []).map((n: any) => (
                  <li key={n.id || n.name}>
                    {n.name} ({n.type}) {n.leaderAgentId && `팀장: ${n.leaderAgentId}`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-2">
              <strong>실행 이력:</strong>
              <ul className="list-disc ml-5">
                {workflowHistory.length === 0 && <li>이력이 없습니다.</li>}
                {workflowHistory.map((h: any) => (
                  <li key={h.id}>
                    {h.id} - {h.status} - {h.createdAt?.slice(0, 19).replace('T', ' ')}
                    <button
                      className="ml-2 text-green-600 underline"
                      onClick={() => handleUpdateExecutionStatus(h.id, 'COMPLETED')}
                    >
                      완료로 변경
                    </button>
                    <button
                      className="ml-2 text-red-600 underline"
                      onClick={() => handleUpdateExecutionStatus(h.id, 'FAILED', '에러 메시지')}
                    >
                      실패로 변경
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 워크플로우 실행 후 채팅 화면 */}
      {showChat && (
        <div className="bg-white rounded shadow p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">워크플로우 실행 채팅</h2>
          <div className="bg-gray-100 border rounded p-4 h-96 overflow-y-auto flex flex-col">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex">
            <input
              className="border px-2 py-1 flex-grow"
              placeholder="메시지 입력"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ml-2"
              onClick={handleSendChat}
              type="button"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}