import { useCallback } from 'react';

export function useDocumentRelations() {
  // 문서 관계 업로드 함수
  const uploadRelations = useCallback(async (relations: any[], brandId?: string) => {
    console.log('문서 관계 업로드 시작', relations);
    for (const rel of relations) {
      if (!rel.from || !rel.to || !rel.type) {
        console.warn('문서 관계 누락:', rel);
        continue;
      }
      try {
        const res = await fetch('/api/document-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromId: rel.from,
            toId: rel.to,
            type: rel.type === 'custom' ? rel.customType : rel.type,
            prompt: rel.prompt,
            seq: rel.seq,
            brandId,
          }),
        });
        const result = await res.json();
        console.log('문서 관계 업로드 응답:', result);
        if (!res.ok) {
          console.error('문서 관계 업로드 실패:', result);
        }
      } catch (err) {
        console.error('문서 관계 업로드 중 에러:', err);
      }
    }
  }, []);

  return { uploadRelations };
}