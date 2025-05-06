'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => setBrands(data));
  }, []);

  return (
    <nav className="bg-gray-100 px-4 py-2 mb-4 rounded">
      <ul className="flex gap-4 items-center">
        <li>
          <Link href="/" className="hover:underline font-semibold">홈</Link>
        </li>
        <li>
          <Link href="/brands" className="hover:underline">브랜드</Link>
        </li>
        <li>
          <Link href="/agents" className="hover:underline">에이전트</Link>
        </li>
        <li>
          <Link href="/teams" className="hover:underline">팀</Link>
        </li>
        <li>
          <Link href="/workflow" className="hover:underline">워크플로우</Link>
        </li>
        <li>
          <Link href="/documents" className="hover:underline">문서</Link>
        </li>
        <li>
          <Link href="/chat" className="hover:underline">채팅</Link>
        </li>
        <li>
          <Link href="/login" className="hover:underline">로그인</Link>
        </li>
        <li>
          <Link href="/about" className="hover:underline">About</Link>
        </li>
        <li>
          <Link href="/documents" className="hover:underline">RAG 문서 관리</Link>
        </li>
        <li>
          <Link href="/vector-search-test" className="hover:underline">벡터검색</Link>
        </li>
        <li>
          {/* 브랜드 선택 드롭다운 */}
          <select
            value={selectedBrandId}
            onChange={e => setSelectedBrandId(e.target.value)}
            className="border px-1 py-0.5 rounded text-sm"
          >
            <option value="">브랜드 선택</option>
            {(Array.isArray(brands) ? brands : []).map((b: any) => (
              <option key={b.id} value={b.id}>{b.name || b.id}</option>
            ))}
          </select>
        </li>
        <li>
          {/* 선택된 브랜드가 있을 때만 링크 표시 */}
          {selectedBrandId && (
            <>
              <Link
                href={`/brands/${selectedBrandId}/ragdocs`}
                className="hover:underline"
              >
                RAG 문서 관리
              </Link>
              <Link
                href={`/vector-search-test?brandId=${selectedBrandId}`}
                className="hover:underline ml-2"
              >
                벡터검색
              </Link>
            </>
          )}
        </li>
      </ul>
    </nav>
  );
}