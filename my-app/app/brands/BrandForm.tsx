import { useState, useEffect } from 'react';
import BrandCreateForm from './BrandCreateForm';
import BrandRelationForm from './BrandRelationForm';

interface BrandFormProps {
  editBrand?: any;
  onSave?: (brand?: any) => void;
  onCancel?: () => void;
}

async function fetchBrandWithRelations(id: string) {
  const res = await fetch(`/api/documents/${id}/with-relations`);
  if (!res.ok) throw new Error('문서 조회 실패');
  return await res.json();
}

export default function BrandForm({ editBrand, onSave, onCancel }: BrandFormProps) {
  // 단계: 'edit' | 'relation'
  const [step, setStep] = useState<'edit' | 'relation'>('edit');
  const [brand, setBrand] = useState<any>(editBrand);
  const [name, setName] = useState<string>('');
  const [mission, setMission] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [docGuides, setDocGuides] = useState<any>({});
  const [relations, setRelations] = useState<any[]>([]);

  // editBrand가 바뀌면 brand도 동기화
  useEffect(() => {
    if (editBrand?.id) {
      fetchBrandWithRelations(editBrand.id).then(setBrand);
    } else {
      setBrand(editBrand);
    }
    setStep('edit');
  }, [editBrand]);

  // 예시: useBrandForm 내부
  useEffect(() => {
    if (editBrand) {
      setName(editBrand.name || '');
      setMission(editBrand.identity?.mission || '');
      setDocuments(editBrand.documents || []);
      setSelectedDocs(editBrand.documents?.map((d: any) => d.id) || []);
      setDocGuides(editBrand.identity?.docGuides || {});
      setRelations(editBrand.identity?.relations || []);
    } else {
      setName('');
      setMission('');
      setDocuments([]);
      setSelectedDocs([]);
      setDocGuides({});
      setRelations([]);
    }
  }, [editBrand]);

  // 1단계: 브랜드 생성/수정
  if (step === 'edit') {
    return (
      <BrandCreateForm
        editBrand={brand}
        onCreated={updatedBrand => {
          setBrand(updatedBrand);
          setStep('relation');
        }}
        onCancel={onCancel}
        isEdit={!!brand && !!brand.id}
      />
    );
  }

  // 2단계: 관계 입력
  return (
    <BrandRelationForm
      brandId={brand.id}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}