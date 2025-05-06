import { useEffect, useState } from 'react';
import React from 'react';

interface BrandRelationFormProps {
  brandId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

import RelationsInput from '../components/RelationsInput';
import useBrandForm from './useBrandForm';
import { useParams } from 'react-router-dom';

export default function BrandRelationForm({ brandId, onSave, onCancel }: BrandRelationFormProps) {
  const form = useBrandForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relationFrom, setRelationFrom] = useState('');
  const [relationTo, setRelationTo] = useState('');
  const [relationType, setRelationType] = useState('');
  const [relationPrompt, setRelationPrompt] = useState('');
  const [relationCustomType, setRelationCustomType] = useState('');

  // 브랜드 및 문서 정보 불러오기
  useEffect(() => {
    async function fetchBrand() {
      setLoading(true);
      setError(null);
      try {
        console.log('[관계입력] fetch 요청 id:', brandId); // ← 이 줄 추가
        const res = await fetch(`/api/brands/${brandId}`);
        const brand = await res.json();
        console.log('[관계입력] fetch 결과:', brand); // ← 이 줄 추가
        console.log('[관계입력] 브랜드/문서 fetch 결과:', brand);
        form.setName(brand.name || '');
        form.setMission(brand.identity?.mission || '');
        form.setDocuments(brand.documents || []);
        form.setSelectedDocs(brand.documents?.map((d: any) => d.id) || []);
        // 문서 정보 및 가이드라인 세팅
        if (brand.documents && brand.documents.length > 0) {
          const guides: Record<string, string> = {};
          brand.documents.forEach((doc: any) => {
            if (doc.id && doc.guide !== undefined) guides[doc.id] = doc.guide;
          });
          form.setDocGuides(guides);
        } else if (brand.ragDocs && brand.ragDocs.length > 0) {
          // ragDocs로 문서 목록 재조회
          const docsRes = await fetch(`/api/documents?ids=${brand.ragDocs.join(',')}`);
          const docs = await docsRes.json();
          const filteredDocs = brand.ragDocs
            .map((id: string) => docs.find((doc: any) => doc.id === id))
            .filter(Boolean);
          form.setDocuments(filteredDocs);
          form.setSelectedDocs(brand.ragDocs);
          const guides: Record<string, string> = {};
          filteredDocs.forEach((doc: any) => {
            if (doc.id) guides[doc.id] = doc.guide ?? '';
          });
          form.setDocGuides(guides);
        } else {
          form.setDocuments([]);
          form.setSelectedDocs([]);
          form.setDocGuides({});
        }
        form.setRelations(brand.identity?.relations || []);
      } catch (e: any) {
        setError('브랜드 정보를 불러오지 못했습니다.');
        console.error('[관계입력] 브랜드/문서 fetch 에러:', e);
      }
      setLoading(false);
    }
    if (brandId) fetchBrand();
    // eslint-disable-next-line
  }, [brandId]);

  // 문서별 관계 정보가 필요하다면 아래처럼 fetch 추가
  async function fetchDocumentWithRelations(docId: string) {
    const res = await fetch(`/api/documents/${docId}/with-relations`);
    return await res.json();
  }
  // 사용 예시: useEffect 등에서 문서별로 호출

  // 관계 저장
  const handleRelationSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // 입력값이 relations에 없으면, relations를 새로 만듦
      let relationsToSave = form.relations;
      if (
        relationFrom &&
        relationTo &&
        relationType &&
        (relationType !== 'custom' || relationCustomType) &&
        relationPrompt
      ) {
        relationsToSave = [
          ...form.relations,
          {
            from: relationFrom,
            to: relationTo,
            type: relationType,
            customType: relationCustomType,
            prompt: relationPrompt,
          },
        ];
      }

      if (!relationsToSave || relationsToSave.length === 0) {
        setError('저장할 관계가 없습니다.');
        alert('저장할 관계가 없습니다.');
        setLoading(false);
        return;
      }

      for (const rel of relationsToSave) {
        // 필수값 검증
        if (!rel.from || !rel.to || !(rel.type || rel.customType) || !rel.prompt || !brandId) {
          setError('필수값이 누락되었습니다.');
          alert('필수값이 누락되었습니다.');
          setLoading(false);
          return;
        }

        const payload = {
          fromId: rel.from,
          toId: rel.to,
          type: rel.type === 'custom' ? rel.customType : rel.type,
          prompt: rel.prompt,
          seq: rel.seq,
          brandId,
        };
        console.log('[관계저장] POST payload:', payload);

        const response = await fetch('/api/document-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        console.log('[관계저장] 응답 status:', response.status);
        let result = null;
        try {
          result = await response.json();
          console.log('[관계저장] 응답 body:', result);
        } catch (e) {
          console.error('[관계저장] 응답 파싱 실패:', e);
        }
        if (!response.ok) {
          setError('문서관계 저장 실패: ' + (result?.message || response.status));
          alert('문서관계 저장 실패: ' + (result?.message || response.status));
          setLoading(false);
          return;
        }
        if (!result?.id) {
          setError('문서관계 저장 실패: 응답에 id가 없습니다.');
          alert('문서관계 저장 실패: 응답에 id가 없습니다.');
          setLoading(false);
          return;
        }
      }

      // ragDocs 동기화
      if (brandId && form.selectedDocs && form.selectedDocs.length > 0) {
        console.log('[관계저장] ragDocs PATCH:', form.selectedDocs);
        const patchRes = await fetch(`/api/brands/${brandId}/ragdocs`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ragDocs: form.selectedDocs }),
        });
        if (!patchRes.ok) {
          setError('ragDocs 저장 실패: ' + patchRes.status);
          alert('ragDocs 저장 실패: ' + patchRes.status);
        }
      }

      // 저장 성공 후 입력란 초기화
      setRelationFrom('');
      setRelationTo('');
      setRelationType('');
      setRelationCustomType('');
      setRelationPrompt('');
      form.setRelations([]); // 저장 후 relations도 초기화

      alert('관계가 저장되었습니다.');
      if (onSave) onSave();
    } catch (e: any) {
      setError('[FRONT] 관계 저장 중 오류: ' + (e?.message || e));
      alert('[FRONT] 관계 저장 중 오류: ' + (e?.message || e));
      console.error('[FRONT] 관계 저장 중 오류:', e);
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleRelationSave();
      }}
    >
      <div className="bg-white rounded shadow p-10 mb-8 max-w-3xl min-w-[700px]">
        <h2 className="text-2xl font-bold mb-6">문서 간 관계 입력</h2>
        {/* 브랜드 정보 표시 */}
        <div className="mb-4">
          <div><span className="font-semibold">브랜드명:</span> {form.name || <span className="text-gray-400">-</span>}</div>
          <div><span className="font-semibold">미션:</span> {form.mission || <span className="text-gray-400">-</span>}</div>
        </div>
        {/* 문서 목록 표시 */}
        <div className="mb-6">
          <div className="font-semibold mb-1">문서 목록</div>
          <ul className="list-disc ml-5">
            {form.documents.length === 0 && <li className="text-gray-400">문서가 없습니다.</li>}
            {form.documents.map((doc: any) => (
              <li key={doc.id}>
                {doc.title || doc.name || doc.id}
              </li>
            ))}
          </ul>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <RelationsInput
          documents={form.documents}
          selectedDocs={form.selectedDocs}
          relations={form.relations}
          setRelations={form.setRelations}
          relationFrom={relationFrom}
          setRelationFrom={setRelationFrom}
          relationTo={relationTo}
          setRelationTo={setRelationTo}
          relationType={relationType}
          setRelationType={setRelationType}
          relationPrompt={relationPrompt}
          setRelationPrompt={setRelationPrompt}
          relationCustomType={relationCustomType}
          setRelationCustomType={setRelationCustomType}
        />
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            저장
          </button>
          {onCancel && (
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={onCancel}
            >
              취소
            </button>
          )}
        </div>
      </div>
    </form>
  );
}