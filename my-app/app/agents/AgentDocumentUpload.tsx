'use client';

import React, { useRef } from 'react';

interface AgentDocumentUploadProps {
  agentId: string;
  teamId: string;
  brandId: string; // ← 추가!
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
  uploadDocDescs: string[];
  setUploadDocDescs: (descs: string[]) => void;
  setDocuments: (docs: any[]) => void;
  onUpload: () => void;
  disabled?: boolean;
}

export default function AgentDocumentUpload({
  agentId,
  teamId,
  brandId, // ← 추가!
  uploadFiles,
  setUploadFiles,
  uploadDocDescs,
  setUploadDocDescs,
  setDocuments,
  onUpload,
  disabled,
}: AgentDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 추가
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [
      ...uploadFiles,
      ...files.filter(f => !uploadFiles.some((uf: File) => uf.name === f.name && uf.size === f.size)),
    ];
    setUploadFiles(newFiles);
    setUploadDocDescs([
      ...uploadDocDescs,
      ...files.map(() => ''),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 파일 삭제
  const handleRemoveFile = (idx: number) => {
    setUploadFiles(uploadFiles.filter((_, i) => i !== idx));
    setUploadDocDescs(uploadDocDescs.filter((_, i) => i !== idx));
  };

  // 파일 선택창 열기
  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  // 업로드
  const handleUpload = async () => {
    if (!agentId || !teamId) {
      alert('팀과 에이전트가 필요합니다.');
      return;
    }
    if (uploadDocDescs.some(desc => !desc)) {
      alert('모든 파일에 설명을 입력해주세요.');
      return;
    }
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      const desc = uploadDocDescs[i];

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('teamId', teamId);
      formData.append('agentId', agentId);
      formData.append('size', file.size.toString());
      formData.append('mimetype', file.type || 'application/octet-stream');
      formData.append('isTeamOnly', 'false');
      formData.append('isBrandOnly', 'false');
      formData.append('isAgentOnly', 'true');
      formData.append('brandId', brandId); // ← 폼데이터에 추가
      // 가이드라인을 metadata에도 JSON 형태로 추가
      formData.append('metadata', desc); // 또는 metadata를 아예 빼고, description만 사용
      // 필요하다면 아래도 추가
      formData.append('vectorized', 'true');

      await fetch(`/api/agents/${agentId}/documents`, {
        method: 'POST',
        body: formData,
      });
    }
    // 업로드 후 목록 새로고침 및 상태 초기화
    const listRes = await fetch(`/api/agents/${agentId}/documents`);
    const listData = await listRes.json();
    setDocuments(Array.isArray(listData) ? listData : []);
    setUploadFiles([]);
    setUploadDocDescs([]);
    onUpload();
  };

  return (
    <div>
      <h2 className="font-bold mb-4 text-lg">2. 문서 업로드</h2>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesChange}
      />
      <button
        type="button"
        className="bg-gray-200 px-2 py-1 rounded mb-2 mr-2"
        onClick={handleAddFileClick}
      >
        문서 추가
      </button>
      {uploadFiles.length === 0 && (
        <div className="text-gray-500 my-2">파일 선택 선택된 파일 없음</div>
      )}
      {uploadFiles.map((file, idx) => (
        <div key={file.name + idx} className="mb-2 border rounded p-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{file.name}</div>
            <button
              className="text-red-500 text-xs ml-2"
              onClick={() => handleRemoveFile(idx)}
              type="button"
            >
              삭제
            </button>
          </div>
          <input
            className="border px-2 py-1 w-full"
            placeholder="설명/가이드라인 (필수)"
            value={uploadDocDescs[idx] || ''}
            onChange={e => {
              const arr = [...uploadDocDescs];
              arr[idx] = e.target.value;
              setUploadDocDescs(arr);
            }}
          />
        </div>
      ))}
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        onClick={handleUpload}
        disabled={disabled || uploadFiles.length === 0}
      >
        문서 업로드
      </button>
    </div>
  );
}