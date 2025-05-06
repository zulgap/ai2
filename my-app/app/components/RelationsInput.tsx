import React from 'react';

export default function RelationsInput({
  documents,
  selectedDocs,
  relations,
  setRelations,
  relationFrom,
  setRelationFrom,
  relationTo,
  setRelationTo,
  relationType,
  setRelationType,
  relationPrompt,
  setRelationPrompt,
  relationCustomType,
  setRelationCustomType,
}: any) {
  // useEffect 완전히 제거

  // 저장 버튼이 있다면 아래처럼 relations에 추가
  // const handleAddRelation = () => {
  //   setRelations([
  //     ...relations,
  //     {
  //       from: relationFrom,
  //       to: relationTo,
  //       type: relationType,
  //       customType: relationCustomType,
  //       prompt: relationPrompt,
  //     },
  //   ]);
  //   // 입력란 초기화
  //   setRelationFrom('');
  //   setRelationTo('');
  //   setRelationType('');
  //   setRelationCustomType('');
  //   setRelationPrompt('');
  // };

  return (
    <div className="mb-2">
      <label className="font-semibold">문서 간 관계 입력</label>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select
          className="w-full max-w-xs border px-2 py-1"
          value={relationFrom}
          onChange={e => setRelationFrom(e.target.value)}
        >
          <option value="">from 문서 선택</option>
          {selectedDocs.map((docId: string) => (
            <option key={docId} value={docId}>
              {documents.find((d: any) => d.id === docId)?.title || docId}
            </option>
          ))}
        </select>
        <span>→</span>
        <select
          className="w-full max-w-xs border px-2 py-1"
          value={relationTo}
          onChange={e => setRelationTo(e.target.value)}
        >
          <option value="">to 문서 선택</option>
          {selectedDocs
            .filter((docId: string) => docId !== relationFrom)
            .map((docId: string) => (
              <option key={docId} value={docId}>
                {documents.find((d: any) => d.id === docId)?.title || docId}
              </option>
            ))}
        </select>
        <select
          className="w-full max-w-xs border px-1 py-1 text-xs"
          value={relationType}
          onChange={e => setRelationType(e.target.value)}
        >
          <option value="">관계 유형 선택</option>
          <option value="and">and 조건</option>
          <option value="or">or 조건</option>
          <option value="before-after">before-after 조건</option>
          <option value="concept-example">개념-예시</option>
          <option value="compare">비교</option>
          <option value="good-bad-example">좋은예-안좋은예</option>
          <option value="original-summary">원문-요약</option>
          <option value="custom">기타</option>
        </select>
        {relationType === 'custom' && (
          <input
            className="border px-2 py-1 w-32"
            placeholder="관계 유형 직접 입력"
            value={relationCustomType}
            onChange={e => setRelationCustomType(e.target.value)}
          />
        )}
        <input
          className="border px-2 py-1 flex-1"
          placeholder="관계 프롬프트"
          value={relationPrompt}
          onChange={e => setRelationPrompt(e.target.value)}
        />
      </div>
      {/* 미리보기 등 필요시 relations.map */}
    </div>
  );
}