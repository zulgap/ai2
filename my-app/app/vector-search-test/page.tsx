'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VectorSearchTestPage() {
  const [query, setQuery] = useState('');
  const [brandId, setBrandId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  // chatHistory의 첫 메시지로 AI 인사 추가
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: '무엇이 궁금하신가요?' }
  ]);

  // 1. 브랜드 목록 불러오기
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const res = await fetch('/api/brands');
        const data = await res.json();
        setBrands(data);
      } catch (err) {
        setBrands([]);
      }
      setBrandsLoading(false);
    };
    fetchBrands();
  }, []);

  // 2. 검색 실행 (채팅형)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    // 사용자 메시지 추가
    const newHistory = [...chatHistory, { role: 'user', content: query }];
    setChatHistory(newHistory);

    try {
      console.log('[FRONT] 요청 전송:', { query, subjectId: brandId, subjectType: 'brand', chatHistory: newHistory });
      const res = await fetch('/api/vector-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          subjectId: brandId,
          subjectType: 'brand',
          chatHistory: newHistory,
        }),
      });
      console.log('[FRONT] 응답 상태:', res.status);
      const data = await res.json();
      console.log('[FRONT] 응답 데이터:', data);
      setResult(data);

      // AI 답변 추가
      if (data.answer) {
        setChatHistory([...newHistory, { role: 'assistant', content: data.answer }]);
      }
      setQuery('');
    } catch (err) {
      console.error('[FRONT] 에러:', err);
      setResult({ error: String(err) });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>브랜드별 RAG 문서 관리 & 벡터검색</h2>
      <div style={{ marginBottom: 24 }}>
        <select
          value={brandId}
          onChange={e => setBrandId(e.target.value)}
          style={{ marginRight: 8, padding: 8 }}
          required
          disabled={brandsLoading}
        >
          <option value="">브랜드 선택</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {brandsLoading && <span style={{ marginLeft: 8 }}>브랜드 목록 불러오는 중...</span>}
      </div>

      {/* 브랜드가 선택된 경우에만 두 기능 모두 표시 */}
      {brandId && (
        <>
          {/* RAG 문서 관리로 이동 */}
          <div style={{ marginBottom: 24 }}>
            <Link
              href={`/brands/${brandId}/ragdocs`}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              RAG 문서 관리 바로가기
            </Link>
          </div>

          {/* 벡터검색 채팅 폼 */}
          <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="AI에게 궁금한 점을 입력하세요"
              style={{ width: '60%', padding: 8 }}
              required
            />
            <button type="submit" style={{ marginLeft: 8, padding: 8 }}>
              질문하기
            </button>
          </form>
          {loading && <div>AI가 답변 중...</div>}

          {/* 채팅 UI */}
          <div style={{ marginTop: 16, background: '#f5f5f5', padding: 16, borderRadius: 8, minHeight: 120 }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ margin: '8px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.role === 'user' ? '#dbeafe' : '#e5e7eb',
                  color: '#222',
                  borderRadius: 8,
                  padding: '8px 12px',
                  maxWidth: '80%',
                }}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>

          {/* 원시 결과(디버깅용) */}
          {result && (
            <pre style={{ marginTop: 16, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}