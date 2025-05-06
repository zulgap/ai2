'use client';

import { useState } from 'react';

interface AgentCreateFormProps {
  brands: any[];
  teams: any[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  onCreated?: () => void;
}

const aiModels = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'mistral', 'custom-ai'];

export default function AgentCreateForm({
  brands,
  teams,
  selectedBrandId,
  setSelectedBrandId,
  selectedTeamId,
  setSelectedTeamId,
  onCreated,
}: AgentCreateFormProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    role: 'ASSISTANT',
    type: 'worker',
    model: aiModels[0],
    temperature: 0.7,
    prompt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 설명/프롬프트 입력값을 하나로 관리
  const handleDescPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      description: value,
      prompt: value,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === 'temperature' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !selectedTeamId) {
      setError('브랜드와 팀을 선택하고 에이전트 이름을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      let res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          teamId: selectedTeamId,
          config: {},
        }),
      });

      let result = await res.json();

      if (!res.ok) {
        setError(result?.error || '에이전트 생성에 실패했습니다.');
        setLoading(false);
        return;
      }

      setForm({
        name: '',
        description: '',
        role: 'ASSISTANT',
        type: 'worker',
        model: aiModels[0],
        temperature: 0.7,
        prompt: '',
      });
      if (onCreated) onCreated();
    } catch (e) {
      setError('에이전트 생성에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-2 max-w-xl" onSubmit={handleSubmit}>
      <label className="font-semibold">브랜드 선택</label>
      <select
        className="border px-2 py-1"
        value={selectedBrandId}
        onChange={e => setSelectedBrandId(e.target.value)}
      >
        <option value="">브랜드를 선택하세요</option>
        {brands.map((b: any) => (
          <option key={b.id} value={b.id}>{b.name || b.id}</option>
        ))}
      </select>
      <label className="font-semibold">팀 선택</label>
      <select
        className="border px-2 py-1"
        value={selectedTeamId}
        onChange={e => setSelectedTeamId(e.target.value)}
        disabled={!selectedBrandId}
      >
        <option value="">팀을 선택하세요</option>
        {teams
          .filter((t: any) => t.brandId === selectedBrandId)
          .map((t: any) => (
            <option key={t.id} value={t.id}>{t.name || t.id}</option>
          ))}
      </select>
      <input
        className="border px-2 py-1"
        name="name"
        placeholder="에이전트 이름"
        value={form.name}
        onChange={handleChange}
      />
      <textarea
        className="border px-2 py-1"
        name="description"
        placeholder="설명/프롬프트"
        value={form.description}
        onChange={handleDescPromptChange}
      />
      <select
        className="border px-2 py-1"
        name="role"
        value={form.role}
        onChange={handleChange}
      >
        <option value="ASSISTANT">ASSISTANT</option>
        <option value="USER">USER</option>
        <option value="SYSTEM">SYSTEM</option>
      </select>
      <select
        className="border px-2 py-1"
        name="type"
        value={form.type}
        onChange={handleChange}
      >
        <option value="leader-single">팀장(싱글)</option>
        <option value="leader-multi">팀장(멀티)</option>
        <option value="worker">팀원</option>
      </select>
      <select
        className="border px-2 py-1"
        name="model"
        value={form.model}
        onChange={handleChange}
      >
        {aiModels.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
      <input
        className="border px-2 py-1"
        name="temperature"
        type="number"
        step="0.01"
        min="0"
        max="2"
        placeholder="Temperature"
        value={form.temperature}
        onChange={handleChange}
      />
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
        type="submit"
        disabled={loading || !selectedTeamId}
      >
        {loading ? '생성 중...' : '에이전트 생성'}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {!selectedTeamId && (
        <div className="text-red-500 text-sm">브랜드와 팀을 먼저 선택하세요.</div>
      )}
    </form>
  );
}