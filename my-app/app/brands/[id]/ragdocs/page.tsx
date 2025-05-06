'use client';

import { useEffect, useState } from 'react';
import { useBrandList } from '../../useBrandList'; // 경로 수정
import Link from 'next/link'; // Link import 추가

export default function RagDocsManagerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 전체 문서 및 ragDocs 불러오기
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/brands/${id}`).then(res => res.json()),
      fetch(`/api/brands/${id}/ragdocs`).then(res => res.json()),
    ]).then(([brand, ragDocsRes]) => {
      setDocuments(brand.documents || []);
      setSelected(ragDocsRes.ragDocs || []);
      setLoading(false);
    }).catch(() => {
      setError('문서 목록을 불러오지 못했습니다.');
      setLoading(false);
    });
  }, [id]);

  const handleChange = (docId: string) => {
    setSelected(selected =>
      selected.includes(docId)
        ? selected.filter(id => id !== docId)
        : [...selected, docId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/brands/${id}/ragdocs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ragDocs: selected }),
    });
    if (res.ok) {
      setSuccess('저장되었습니다.');
    } else {
      setError('저장 실패');
    }
    setSaving(false);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RAG에 사용할 문서 선택</h1>
      <ul className="mb-6">
        {documents.map(doc => (
          <li key={doc.id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selected.includes(doc.id)}
              onChange={() => handleChange(doc.id)}
              id={`doc-${doc.id}`}
            />
            <label htmlFor={`doc-${doc.id}`}>{doc.title || doc.name || doc.id}</label>
          </li>
        ))}
      </ul>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '저장 중...' : '저장'}
      </button>
      {success && <div className="text-green-600 mt-2">{success}</div>}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}

export function Navbar() {
  const { brands } = useBrandList();
  const brandId = brands.length > 0 ? brands[0].id : '';

  return (
    <nav className="bg-gray-100 px-4 py-2 mb-4 rounded">
      <ul className="flex gap-4">
        {/* ...기존 메뉴... */}
        <li>
          {brandId && (
            <Link href={`/brands/${brandId}/ragdocs`} className="hover:underline">
              RAG 문서 관리
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

// 예시: app/api/brands/[id]/ragdocs/route.ts
export async function GET(context: any) {
  const { params } = context; // await 제거
  const { id } = params;
  // ...
}