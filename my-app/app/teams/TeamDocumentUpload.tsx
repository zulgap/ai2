import React, { useRef } from 'react';

export default function TeamDocumentUpload({
  uploadFiles,
  setUploadFiles,
  uploadDocDescs,
  setUploadDocDescs,
  onUpload,
  disabled,
  selectedTeamId,
  setDocuments,
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 추가 핸들러 (누적 업로드 지원)
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

  // 파일 삭제 핸들러
  const handleRemoveFile = (idx: number) => {
    setUploadFiles(uploadFiles.filter((_: File, i: number) => i !== idx));
    setUploadDocDescs(uploadDocDescs.filter((_: string, i: number) => i !== idx));
  };

  // 문서추가 버튼 클릭 시 파일 선택창 열기
  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  // 팀 문서 업로드
  const handleUpload = async () => {
    if (!selectedTeamId) {
      alert('팀이 선택되지 않았습니다. 팀을 먼저 생성하거나 선택하세요.');
      return;
    }
    if (uploadDocDescs.some((desc: string) => !desc)) {
      alert('모든 파일에 설명을 입력해주세요.');
      return;
    }
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      const desc = uploadDocDescs[i];

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('description', desc);
      formData.append('isTeamOnly', 'true');
      formData.append('isBrandOnly', 'false');
      formData.append('isAgentOnly', 'false');

      await fetch(`/api/teams/documents?teamId=${selectedTeamId}`, {
        method: 'POST',
        body: formData,
      });
    }
    // 업로드 후 문서 목록 새로고침
    const listRes = await fetch(`/api/teams/documents?teamId=${selectedTeamId}`);
    const listData = await listRes.json();
    setDocuments(Array.isArray(listData) ? listData : []);
    // 업로드 성공 후 상태 초기화
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
      {uploadFiles.map((file: File, idx: number) => (
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
        onClick={onUpload}
        disabled={disabled || uploadFiles.length === 0}
      >
        문서 업로드
      </button>
    </div>
  );
}