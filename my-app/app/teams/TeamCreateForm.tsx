import React from 'react';

export default function TeamCreateForm({
  brands, // ← props로 받음
  selectedBrandId,
  setSelectedBrandId,
  name,
  setName,
  description,
  setDescription,
  category,
  setCategory,
  onCreate,
  disabled,
}: any) {

  return (
    <div>
      <h2 className="font-bold mb-4 text-lg">1. 팀 생성</h2>
      <label className="block mb-2 font-semibold">브랜드 선택</label>
      <select
        className="border px-2 py-1 mb-2 w-full"
        value={selectedBrandId || ''}
        onChange={e => setSelectedBrandId(e.target.value)}
      >
        <option value="">브랜드를 선택하세요</option>
        {Array.isArray(brands) && brands.map((b: any) => (
          <option key={b.id} value={b.id}>{b.name || b.id}</option>
        ))}
      </select>
      <input
        className="border px-2 py-1 mb-2 w-full"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="팀명"
      />
      <input
        className="border px-2 py-1 mb-2 w-full"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="미션(설명)"
      />
      <input
        className="border px-2 py-1 mb-2 w-full"
        value={category}
        onChange={e => setCategory(e.target.value)}
        placeholder="카테고리"
      />
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        onClick={onCreate}
        disabled={disabled}
      >
        팀 생성
      </button>
    </div>
  );
}