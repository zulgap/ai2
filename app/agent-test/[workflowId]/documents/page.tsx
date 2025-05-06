'use client';
import React, { useState } from "react";

export default function RagDocumentUploader({ params }: { params: { agentId: string } }) {
  const agentId = params.agentId;
  const [files, setFiles] = useState<File[]>([]);
  const [filePurposes, setFilePurposes] = useState<string[]>([]);
  const [relations, setRelations] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(newFiles);
    setFilePurposes(new Array(newFiles.length).fill(''));
  };

  const updatePurpose = (idx: number, value: string) => {
    setFilePurposes(purposes => {
      const arr = [...purposes];
      arr[idx] = value;
      return arr;
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append('files', file);
      formData.append(`purpose_${idx}`, filePurposes[idx]);
    });
    formData.append('relations', relations);
    formData.append('agentId', agentId);

    await fetch('/api/rag-documents/upload', {
      method: 'POST',
      body: formData,
    });
    setUploading(false);
    setFiles([]);
    setFilePurposes([]);
    setRelations('');
    alert('업로드 완료!');
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto">
      <h2 className="font-bold mb-4">RAG 문서 등록</h2>
      <input type="file" multiple onChange={handleFileChange} className="mb-4" />
      {files.map((file, idx) => (
        <div key={file.name} className="mb-2">
          <div>파일명: {file.name}</div>
          <input
            className="border p-2 rounded w-full"
            placeholder="이 문서의 목적/설명"
            value={filePurposes[idx] || ''}
            onChange={e => updatePurpose(idx, e.target.value)}
          />
        </div>
      ))}
      {files.length > 1 && (
        <textarea
          className="border p-2 rounded w-full mb-2"
          placeholder="(선택) 여러 문서 간 관계를 설명해 주세요. 예: 'A는 B의 예시, C는 B의 반례'"
          value={relations}
          onChange={e => setRelations(e.target.value)}
        />
      )}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? '업로드 중...' : '문서 업로드'}
      </button>
    </div>
  );
}