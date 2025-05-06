import { useState } from 'react';

export default function useBrandForm(editBrand?: any) {
  const [name, setName] = useState(editBrand?.name || '');
  const [mission, setMission] = useState(editBrand?.identity?.mission || '');
  const [documents, setDocuments] = useState<any[]>(editBrand?.documents || []);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    editBrand?.documents?.map((d: any) => d.id) || []
  );
  const [docGuides, setDocGuides] = useState<{ [docId: string]: string }>(
    editBrand?.identity?.docGuides || {}
  );
  const [relations, setRelations] = useState<any[]>(editBrand?.identity?.relations || []);
  const [loading, setLoading] = useState(false);

  // 가이드라인 변경 핸들러
  const handleGuideChange = (docId: string, guide: string) => {
    setDocGuides(prev => ({ ...prev, [docId]: guide }));
  };

  return {
    name, setName,
    mission, setMission,
    documents, setDocuments,
    selectedDocs, setSelectedDocs,
    docGuides, setDocGuides,
    relations, setRelations,
    loading, setLoading,
    handleGuideChange,
  };
}