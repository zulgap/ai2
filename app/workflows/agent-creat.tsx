'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AgentDetailForm from "../components/AgentDetailForm";

type Team = { id: string; name: string };

export default function AgentCreate() {
  const router = useRouter();
  const [type] = useState<'leader' | 'worker'>('worker');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('GPT-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [prompt, setPrompt] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [agentId, setAgentId] = useState<string | null>(null); // agentId 상태 추가

  // 팀 목록 불러오기
  useEffect(() => {
    fetch("/api/teams")
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        if (data.length > 0) setSelectedTeamId(data[0].id);
      });
  }, []);

  const handleSubmit = async () => {
    try {
      const isEdit = !!agentId; // agentId가 있으면 수정, 없으면 생성
      const url = '/api/agents';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        // agentId가 있으면 id 포함
        ...(isEdit ? { id: agentId } : {}),
        type,
        name,
        description,
        model,
        temperature,
        prompt,
        teamId: selectedTeamId,
        // 필요하다면 userId 등 추가
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(isEdit ? '에이전트 수정 실패:' : '에이전트 생성 실패:', data);
        alert((isEdit ? '에이전트 저장 실패: ' : '에이전트 생성 실패: ') + (data?.error || '알 수 없는 오류'));
        return;
      }
      router.push('/workflows');
    } catch (error) {
      console.error('에이전트 저장/생성 중 예외:', error);
      alert('에이전트 저장/생성 중 예외 발생');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-[400px]">
        <h2 className="font-bold text-lg mb-4">에이전트 생성</h2>
        <AgentDetailForm
          teams={teams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          isEdit={false}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          model={model}
          setModel={setModel}
          temperature={temperature}
          setTemperature={setTemperature}
          prompt={prompt}
          setPrompt={setPrompt}
          onSave={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

/*
  agentId는 수정 시에만 값이 있고, 생성 시에는 undefined/null이어야 합니다.
  agentId를 props로 받거나, 상태로 관리해야 합니다.
*/