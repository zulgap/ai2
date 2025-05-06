'use client';
import DocumentUploader from '../../../components/DocumentUploader';
import BrandRelationForm from '../../BrandRelationForm';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useDocumentUpload } from '@/app/brands/useDocumentUpload';

export default function BrandManagePage() {
  const params = useParams();
  const brandId = params.id as string;

  if (!brandId || brandId === 'undefined') {
    return <div>잘못된 접근입니다. 브랜드를 먼저 생성하세요.</div>;
  }

  const [refreshKey, setRefreshKey] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const { uploadDocuments } = useDocumentUpload();

  // 파일 선택 시 문서 추가
  const handleUpload = (docs: any[]) => {
    setDocuments(docs);
  };

  // 문서 삭제
  const handleRemove = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // 실제 업로드
  const handleDocumentsUploaded = async () => {
    console.log('[업로드] documents 상태:', documents);
    try {
      const uploadedDocIds = await uploadDocuments(documents, [], {}, brandId);
      if (uploadedDocIds && uploadedDocIds.length > 0) {
        console.log('[업로드] 파일 업로드 성공:', uploadedDocIds);
        setRefreshKey(k => k + 1);
        setDocuments([]);
        console.log('[업로드] 모든 파일 업로드 완료, 관계입력 폼 새로고침');
      } else {
        alert('문서 업로드 실패: 업로드된 문서가 없습니다.');
      }
    } catch (e) {
      console.error('[업로드] 네트워크 오류 (manage/page.tsx):', e);
      alert('문서 업로드 중 네트워크 오류가 발생했습니다. (manage/page.tsx)');
    }
  };

  return (
    <div>
      <DocumentUploader
        documents={documents}
        onUpload={handleUpload}
        onRemove={handleRemove}
      />
      <button onClick={handleDocumentsUploaded}>업로드</button>
      <BrandRelationForm brandId={brandId} key={refreshKey} />
    </div>
  );
}