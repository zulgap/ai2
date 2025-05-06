'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../../components/Navbar';

export default function DocumentDetailPage({ params }: { params: { id: string; docId: string } }) {
  const { id, docId } = params;
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/brands/${id}/documents/${docId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.detail || data.error);
        else setDoc(data);
        setLoading(false);
      });
  }, [id, docId]);

  useEffect(() => {
    fetch(`/api/brands/${id}/documents/${docId}/chunks`)
      .then(res => res.json())
      .then(data => setChunks(data.chunks || []));
  }, [id, docId]);

  const refreshChunks = async () => {
    setRefreshing(true);
    const res = await fetch(`/api/brands/${id}/documents/${docId}/chunks`);
    const data = await res.json();
    setChunks(data.chunks || []);
    setRefreshing(false);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!doc) return <div>문서를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Navbar /> {/* 네비게이션 바 추가 */}
      <h1 className="text-2xl font-bold mb-4">{doc.title || doc.name || doc.id}</h1>
      <div className="mb-2 text-gray-600">문서 ID: {doc.id}</div>
      <div className="mb-2">파일명: {doc.name}</div>
      <div className="mb-2">메타데이터: <pre>{JSON.stringify(doc.metadata, null, 2)}</pre></div>
      <div className="mb-2">가이드라인: {doc.guide || '-'}</div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="font-semibold mb-1">청크 목록</h2>
        <button
          className="text-xs bg-gray-200 px-2 py-1 rounded"
          onClick={refreshChunks}
          disabled={refreshing}
        >
          {refreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>
      {chunks && chunks.length > 0 ? (
        <ul className="border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto">
          {chunks.map((chunk: any) => (
            <li key={chunk.id} className="mb-2">
              <div className="font-mono text-xs text-gray-700">
                <b>#{chunk.chunkIndex}</b> {chunk.content.slice(0, 60)}...
              </div>
              <div className="text-xs text-gray-500">
                임베딩: {chunk.embedding ? 'O' : 'X'}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-400">청크 없음</div>
      )}
    </div>
  );
}

