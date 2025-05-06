import React from 'react';

export interface DocumentItem {
  id: string;
  title: string;
  file?: File;
  isTemp?: boolean;
}

type DocumentUploaderProps = {
  documents: any[];
  onUpload: (docs: any[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  brandId?: string; // ← optional로 변경
  onUploaded?: () => void;
};

export default function DocumentUploader({
  documents,
  onUpload,
  onRemove,
  disabled = false,
  brandId,
  onUploaded,
}: DocumentUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const docs = files.map(file => ({
      file,
      name: file.name,
      title: file.name,
      isTemp: true,
      id: `${file.name}_${Date.now()}_${Math.random()}`,
    }));
    // 기존 문서와 새 파일 합치기
    onUpload([...documents, ...docs]);
  };

  const handleUpload = async () => {
    for (const doc of documents) {
      if (!doc.file) continue;
      const formData = new FormData();
      formData.append('file', doc.file);
      if (brandId) {
        formData.append('brandId', brandId);
      }
      // 실제 업로드
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const uploadedDoc = await res.json();
      const uploadedDocId = uploadedDoc.id;

      // ragDocs 자동 추가
      if (brandId && uploadedDocId) {
        // 기존 ragDocs 불러오기
        const ragDocsRes = await fetch(`/api/brands/${brandId}/ragdocs`);
        const ragDocs = await ragDocsRes.json();
        const newRagDocs = Array.from(new Set([...(ragDocs.ragDocs || []), uploadedDocId]));
        // PATCH로 업데이트
        await fetch(`/api/brands/${brandId}/ragdocs`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ragDocs: newRagDocs }),
        });
      }
    }
    if (onUploaded) onUploaded();
  };

  return (
    <div className="mb-2">
      <label className="font-semibold block mb-1">문서 업로드</label>
      <div className="flex items-center gap-2">
        <label className="bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">
          파일 선택
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
        <span className="text-gray-500 text-sm">
          {documents.length === 0 && '업로드된 문서 없음'}
        </span>
      </div>
      {documents.length > 0 && (
        <ul className="mt-2">
          {documents.map((doc: any, idx: number) => (
            <li key={doc.id} className="flex items-center gap-2 mb-1">
              <span className="font-mono">{doc.title}</span>
              {doc.isTemp && <span className="text-xs text-yellow-600">(신규)</span>}
              <input
                type="text"
                placeholder="가이드라인 입력"
                value={doc.guide || ''}
                onChange={e => {
                  const newDocs = [...documents];
                  newDocs[idx] = { ...newDocs[idx], guide: e.target.value };
                  onUpload(newDocs);
                }}
                className="border px-1 py-0.5 text-xs ml-2"
                style={{ width: 120 }}
                disabled={disabled}
              />
              <button
                type="button"
                className="text-red-500 text-xs px-2 py-0.5 border border-red-300 rounded"
                onClick={() => onRemove(doc.id)}
                disabled={disabled}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}