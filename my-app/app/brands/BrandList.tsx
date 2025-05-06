import React from 'react';
import { useBrandList } from './useBrandList';
import BrandForm from './BrandForm';

interface BrandListProps {
  onEdit: (brand: any) => void;
}

export default function BrandList({ onEdit }: BrandListProps) {
  const {
    brands,
    loading,
    detail,
    setDetail,
    editBrand,
    setEditBrand,
    fetchBrands,
    handleDelete,
  } = useBrandList();

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold">브랜드 목록</h1>
        <button
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={() => onEdit({})}
        >
          브랜드 추가
        </button>
        <button
          className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm"
          onClick={fetchBrands}
        >
          새로고침
        </button>
      </div>
      {loading && <div className="text-blue-500 mb-2">로딩 중...</div>}
      <ul className="mb-4">
        {(Array.isArray(brands) ? brands : []).map((brand: any) => (
          <li key={brand.id} className="mb-2 flex items-center gap-2">
            <span className="font-semibold cursor-pointer underline flex-1">
              {brand.name}
            </span>
            <button
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              onClick={() => onEdit(brand)}
            >
              수정
            </button>
            <button
              className="text-red-500 text-xs"
              onClick={() => handleDelete(brand.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[320px] max-w-lg">
            <h2 className="text-lg font-bold mb-2">{detail.name}</h2>
            <div className="mb-2">
              <strong>미션:</strong> {detail.identity?.mission || '-'}
            </div>
            <div className="mb-2">
              <strong>연결 문서:</strong>
              <ul className="list-disc ml-5">
                {(detail.documents || []).map((doc: any) => (
                  <li key={doc.id}>{doc.title || doc.id}</li>
                ))}
              </ul>
            </div>
            <div className="mb-2">
              <strong>문서별 가이드:</strong>
              <ul className="list-disc ml-5">
                {detail.identity?.docGuides &&
                  Object.entries(detail.identity.docGuides).map(([docId, guide]: any) => (
                    <li key={docId}>
                      <span className="font-mono">{docId}</span>: {guide}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="mb-2">
              <strong>문서 간 관계:</strong>
              <ul className="list-disc ml-5">
                {(detail.identity?.relations || []).map(
                  (rel: any, idx: number) => (
                    <li key={idx}>
                      {rel.from} → {rel.to}: {rel.type ? `[${rel.type}] ` : ''}{rel.prompt}
                    </li>
                  )
                )}
              </ul>
            </div>
            <button
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded"
              onClick={() => setDetail(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}