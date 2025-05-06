'use client';

import { useEffect, useState } from 'react';

// 문서 상세/청크/가이드/메타데이터 등 표시용 컴포넌트
function DocumentDetail({ doc, chunks, onClose }: { doc: any, chunks: any[], onClose: () => void }) {
  if (!doc) return null;

  const [regenLoading, setRegenLoading] = useState(false);
  const [regenMsg, setRegenMsg] = useState<string | null>(null);

  const handleRegen = async () => {
    setRegenLoading(true);
    setRegenMsg(null);
    const res = await fetch(`/api/brands/${doc.brandId}/documents/${doc.id}/regen-chunks`, {
      method: 'POST',
    });
    if (res.ok) {
      setRegenMsg('임베딩/청크 재생성 완료! 새로고침 해주세요.');
    } else {
      setRegenMsg('재생성 실패');
    }
    setRegenLoading(false);
  };

  const guide =
    (doc.metadata && typeof doc.metadata === 'object' ? doc.metadata.guide : undefined) ||
    '-';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2">{doc.title || doc.name || doc.id}</h2>
        <div className="mb-2 text-sm text-gray-600">파일명: {doc.name}</div>
        <div className="mb-2 text-sm text-gray-600">사이즈: {doc.size} / 타입: {doc.mimetype}</div>
        <div className="mb-2 text-sm text-gray-600">
          <span className="font-semibold">가이드라인:</span> <span className="text-black">{guide}</span>
        </div>
        <div className="mb-2 text-sm text-gray-600">생성일: {doc.createdAt}</div>
        <div className="mb-2 text-sm text-gray-600">임베딩 정보:
          <pre className="bg-gray-100 rounded p-2 text-xs max-h-32 overflow-auto">{doc.embedding ? JSON.stringify(doc.embedding, null, 2) : '-'}</pre>
        </div>
        <div className="mb-2 text-sm text-gray-600">청크 목록:</div>
        <ul className="max-h-40 overflow-auto text-xs bg-gray-50 rounded p-2 border">
          {chunks.length === 0 && <li className="text-gray-400">청크 없음</li>}
          {chunks.map(chunk => (
            <li key={chunk.id} className="mb-1">
              <span className="font-mono text-blue-700">#{chunk.chunkIndex}</span> {chunk.content.slice(0, 60)}...
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${chunk.embedding ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                임베딩: {chunk.embedding ? 'O' : 'X'}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleRegen}
          disabled={regenLoading}
        >
          {regenLoading ? '재생성 중...' : '임베딩/청크 재생성'}
        </button>
        {regenMsg && <div className="mt-2 text-sm">{regenMsg}</div>}
      </div>
    </div>
  );
}

export default function DocumentAdminPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [ragDocs, setRagDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 데이터 불러오기
  async function reloadData() {
    setLoading(true);
    const [docs, rels, brands] = await Promise.all([
      fetch('/api/documents').then(res => res.json()),
      fetch('/api/document-relations').then(res => res.json()),
      fetch('/api/brands').then(res => res.json()),
    ]);
    setDocuments(Array.isArray(docs) ? docs : []);
    setRelations(Array.isArray(rels) ? rels : []);
    setBrands(Array.isArray(brands) ? brands : []);
    setLoading(false);
  }

  // 브랜드별 ragDocs 불러오기
  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (!selectedBrandId) {
      setRagDocs([]);
      return;
    }
    fetch(`/api/brands/${selectedBrandId}/ragdocs`)
      .then(res => res.json())
      .then(data => setRagDocs(data.ragDocs || []));
  }, [selectedBrandId]);

  // 문서 상세/청크 불러오기
  const handleDocClick = async (doc: any) => {
    setSelectedDoc(doc);
    const res = await fetch(`/api/brands/${doc.brandId}/documents/${doc.id}/chunks`);
    const data = await res.json();
    setChunks(data.chunks || []);
  };

  // RAG 문서 저장
  const handleSave = async () => {
    if (!selectedBrandId) return;
    setSaving(true);
    await fetch(`/api/brands/${selectedBrandId}/ragdocs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ragDocs }),
    });
    setSaving(false);
  };

  // 브랜드별 문서 필터링
  const filteredDocuments = selectedBrandId
    ? documents.filter((doc: any) => doc.brandId === selectedBrandId)
    : documents;

  // 브랜드별 문서 관계 필터링
  const filteredRelations = Array.isArray(relations)
    ? (selectedBrandId
        ? relations.filter((rel: any) => rel.brandId === selectedBrandId)
        : relations)
    : [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">브랜드별 RAG 문서 관리</h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="mr-2 font-semibold">브랜드 선택:</label>
          <select
            value={selectedBrandId}
            onChange={e => setSelectedBrandId(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">전체</option>
            {brands.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name || b.id}</option>
            ))}
          </select>
        </div>
        {selectedBrandId && (
          <button
            className={`px-4 py-2 rounded text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : 'RAG 문서 저장'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="mb-8 border w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th>RAG</th>
              <th>ID</th>
              <th>제목</th>
              <th>브랜드</th>
              <th>생성일</th>
              <th>상세</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map(doc => (
              <tr key={doc.id} className="hover:bg-blue-50 transition">
                <td>
                  {selectedBrandId && (
                    <input
                      type="checkbox"
                      checked={ragDocs.includes(doc.id)}
                      onChange={e => {
                        setRagDocs(ragDocs =>
                          e.target.checked
                            ? [...ragDocs, doc.id]
                            : ragDocs.filter(id => id !== doc.id)
                        );
                      }}
                    />
                  )}
                </td>
                <td>{doc.id}</td>
                <td>{doc.title}</td>
                <td>{brands.find(b => b.id === doc.brandId)?.name || doc.brandId}</td>
                <td>{doc.createdAt}</td>
                <td>
                  <button
                    className="text-blue-600 underline"
                    onClick={() => handleDocClick(doc)}
                  >
                    상세
                  </button>
                </td>
                <td>
                  <button
                    className="text-red-500 underline"
                    onClick={async () => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
                          if (!res.ok) {
                            const err = await res.json();
                            alert('삭제 실패: ' + (err.error || '알 수 없는 오류'));
                          } else {
                            await reloadData();
                          }
                        } catch (e) {
                          alert('삭제 중 오류 발생');
                        }
                        setLoading(false);
                      }
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mb-2">문서 관계 목록</h2>
      <div className="overflow-x-auto">
        <table className="border w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th>ID</th>
              <th>fromId</th>
              <th>toId</th>
              <th>brandId</th>
              <th>type</th>
              <th>prompt</th>
              <th>seq</th>
              <th>createdAt</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredRelations.map(rel => (
              <tr key={rel.id}>
                <td>{rel.id}</td>
                <td>{documents.find(d => d.id === rel.fromId)?.title || rel.fromId}</td>
                <td>{rel.toId}</td>
                <td>{rel.brandId}</td>
                <td>{rel.type}</td>
                <td>{rel.prompt}</td>
                <td>{rel.seq}</td>
                <td>{rel.createdAt}</td>
                <td>
                  <button
                    className="text-red-500 underline"
                    onClick={async () => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        setLoading(true);
                        await fetch(`/api/document-relations/${rel.id}`, { method: 'DELETE' });
                        setRelations(rs => rs.filter(r => r.id !== rel.id));
                        setLoading(false);
                      }
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 문서 상세/청크 모달 */}
      {selectedDoc && (
        <DocumentDetail doc={selectedDoc} chunks={chunks} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}