import React, { useState } from 'react';

export interface AgentRelationFormProps {
  documents: any[];
  RELATION_TYPES: { value: string; label: string }[];
  relationFrom: string;
  setRelationFrom: React.Dispatch<React.SetStateAction<string>>;
  relationTo: string;
  setRelationTo: React.Dispatch<React.SetStateAction<string>>;
  relationType: string;
  setRelationType: React.Dispatch<React.SetStateAction<string>>;
  relationPrompt: string;
  setRelationPrompt: React.Dispatch<React.SetStateAction<string>>;
  relations: any[];
  addRelation: () => void;
  removeRelation: (idx: number) => void;
  saveRelations: () => void;
  disabled: boolean;
  selectedAgentId: string;
}

export default function AgentRelationForm(props: AgentRelationFormProps) {
  const {
    documents,
    RELATION_TYPES,
    relationFrom,
    setRelationFrom,
    relationTo,
    setRelationTo,
    relationType,
    setRelationType,
    relationPrompt,
    setRelationPrompt,
    relations,
    addRelation,
    removeRelation,
    saveRelations,
    disabled,
    selectedAgentId,
  } = props;

  const agentDocs = Array.isArray(documents)
    ? documents.filter((doc: any) => doc.agentId === selectedAgentId)
    : [];

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
            onClick={addRelation}
            disabled={disabled}
            type="button"
          >
            관계 저장
          </button>
        </div>
      </div>
    </div>
  );
}