// useDocumentUpload.ts
export function useDocumentUpload() {
  const uploadDocuments = async (
    documents: any[],
    relations: any[],
    docGuides: { [docId: string]: string },
    brandId?: string
  ) => {
    const uploadedDocIds: string[] = [];
    for (const doc of documents) {
      if (doc.isTemp) {
        try {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('title', doc.title);
          if (brandId) formData.append('brandId', brandId);

          if (docGuides && docGuides[doc.id]) {
            formData.append('metadata', JSON.stringify({ guide: docGuides[doc.id] }));
          }

          if (doc.file.type && doc.file.type.startsWith('text/')) {
            try {
              const fileContent = await doc.file.text();
              formData.append('content', fileContent.replace(/\u0000/g, ''));
            } catch (err) {
              console.error('[useDocumentUpload][content-read] 파일 내용 읽기 실패:', err);
              formData.append('content', '');
            }
          } else {
            formData.append('content', '');
          }

          const relationsForDoc = relations
            .filter((rel: any) => rel.from === doc.id || rel.to === doc.id)
            .map((rel: any) => ({ ...rel }));
          if (relationsForDoc.length > 0) {
            formData.append('relations', JSON.stringify(relationsForDoc));
          }
          formData.append('isBrandOnly', 'true');
          formData.append('isTeamOnly', 'false');
          formData.append('isAgentOnly', 'false');
          console.log('[useDocumentUpload] FormData keys:', Array.from(formData.keys()));
          console.log('[useDocumentUpload] 문서 업로드 fetch 시작', doc.title);

          let res;
          try {
            res = await fetch(`/api/brands/${brandId}/documents`, {
              method: 'POST',
              body: formData,
            });
          } catch (err) {
            console.error('[useDocumentUpload][fetch] 네트워크 오류:', err);
            throw new Error(`[useDocumentUpload][fetch] 네트워크 오류: ${doc.title}`);
          }

          console.log('[useDocumentUpload] 문서 업로드 fetch 응답', res.status);

          let uploaded;
          try {
            uploaded = await res.json();
          } catch (err) {
            console.error('[useDocumentUpload][json-parse] 응답 JSON 파싱 실패:', err);
            throw new Error(`[useDocumentUpload][json-parse] 응답 JSON 파싱 실패: ${doc.title}`);
          }

          console.log('[useDocumentUpload] 업로드된 문서 id:', uploaded.id);

          if (!res.ok) {
            console.error('[useDocumentUpload][response] 업로드 실패:', uploaded);
            throw new Error(`[useDocumentUpload][response] 문서 업로드 실패: ${doc.title} - ${uploaded?.error || res.status}`);
          }
          if (uploaded.id) uploadedDocIds.push(uploaded.id);
        } catch (err) {
          console.error('[useDocumentUpload][전체] 문서 업로드 중 예외:', err);
          throw err;
        }
      } else if (doc.id) {
        uploadedDocIds.push(doc.id);
      }
    }

    // === ragDocs 자동 추가: 모든 업로드 후 한 번만 실행 ===
    if (brandId && uploadedDocIds.length > 0) {
      // 기존 ragDocs 불러오기
      const ragDocsRes = await fetch(`/api/brands/${brandId}/ragdocs`);
      const ragDocs = await ragDocsRes.json();
      const newRagDocs = Array.from(new Set([...(ragDocs.ragDocs || []), ...uploadedDocIds]));
      // PATCH로 업데이트
      const patchRes = await fetch(`/api/brands/${brandId}/ragdocs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ragDocs: newRagDocs }),
      });
      console.log('[useDocumentUpload] ragDocs PATCH 응답', patchRes.status, await patchRes.text());
    }

    return uploadedDocIds.filter(Boolean);
  };
  return { uploadDocuments };
}