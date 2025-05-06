import React from 'react';

export default function DocGuidesInput({
  documents,
  selectedDocs,
  docGuides,
  onChange,
}: {
  documents: any[];
  selectedDocs: string[];
  docGuides: { [docId: string]: string };
  onChange: (docId: string, guide: string) => void;
}) {
  return (
    <div className="mb-2">
      <label className="font-semibold">문서별 가이드라인</label>
      {selectedDocs.map(docId => (
        <div key={docId} className="flex items-center gap-2 mb-1">
          <span className="font-mono">{documents.find((d: any) => d.id === docId)?.title || docId}</span>
          <input
            className="border px-2 py-1 flex-1"
            placeholder="가이드라인"
            value={docGuides[docId] || ''}
            onChange={e => onChange(docId, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}