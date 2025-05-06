import React from "react";

type Team = { id: string; name: string };

type AgentDetailFormProps = {
  teams: Team[];
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
};

export default function AgentDetailForm({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  name,
  setName,
  description,
  setDescription,
  model,
  setModel,
  temperature,
  setTemperature,
  prompt,
  setPrompt,
  onSave,
  onCancel,
  isEdit
}: AgentDetailFormProps) {
  return (
    <div>
      {/* 팀명 드롭다운 */}
      <div className="mb-2">
        <label className="block mb-1">팀명</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedTeamId}
          onChange={e => setSelectedTeamId(e.target.value)}
        >
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block mb-1">에이전트명</label>
        <input className="border p-2 rounded w-full" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block mb-1">설명</label>
        <textarea className="border p-2 rounded w-full" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block mb-1">AI 모델</label>
        <select className="border p-2 rounded w-full" value={model} onChange={e => setModel(e.target.value)}>
          <option value="GPT-4o">GPT-4o</option>
          <option value="Claude-3">Claude-3</option>
          <option value="GPT-3.5">GPT-3.5</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Temperature: {temperature}</label>
        <input type="range" min={0} max={1} step={0.01} value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full" />
      </div>
      {/* 역할(프롬프트) */}
      <div className="mb-2">
        <label className="block mb-1">역할</label>
        <textarea
          className="border p-2 rounded w-full"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="에이전트의 역할을 입력하세요"
        />
      </div>
      {/* 문서 추가 버튼 */}
      <div className="mb-4">
        <button className="border px-3 py-2 rounded w-full bg-gray-100 text-gray-700" disabled>
          문서 추가 (준비중)
        </button>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onCancel}>취소</button>
        )}
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSave}>
          {isEdit ? "노드저장" : "노드저장"}
        </button>
      </div>
    </div>
  );
}