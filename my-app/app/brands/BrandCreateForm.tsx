import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BrandCreateFormProps {
  editBrand?: any;
  onCreated: (brand: any) => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export default function BrandCreateForm({ editBrand, onCreated, onCancel, isEdit }: BrandCreateFormProps) {
  const [name, setName] = useState('');
  const [mission, setMission] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (editBrand) {
      setName(editBrand.name || '');
      setMission(editBrand.identity?.mission || '');
    } else {
      setName('');
      setMission('');
    }
  }, [editBrand]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    if (!name || !mission) {
      setError('브랜드명과 미션을 모두 입력하세요.');
      setLoading(false);
      return;
    }
    try {
      const brandRes = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          identity: { mission },
        }),
      });
      const brandData = await brandRes.json();
      console.log('브랜드 생성 응답:', brandData); // ← 이 줄 추가
      const brandId = brandData.id;
      if (brandId) {
        router.push(`/brands/${brandId}/manage`); // 생성 후 해당 브랜드 관리 페이지로 이동
      } else {
        setError('브랜드 생성 실패: ID가 반환되지 않았습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6 mb-8 max-w-lg">
      <h2 className="text-xl font-bold mb-4">{isEdit ? '브랜드 수정' : '브랜드 생성'}</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-2">
        <label className="font-semibold">브랜드명<span className="text-red-500">*</span></label>
        <input
          className="border px-2 py-1 w-full"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="브랜드명"
        />
      </div>
      <div className="mb-2">
        <label className="font-semibold">브랜드 미션<span className="text-red-500">*</span></label>
        <input
          className="border px-2 py-1 w-full"
          value={mission}
          onChange={e => setMission(e.target.value)}
          placeholder="브랜드 미션"
        />
      </div>
      <div className="flex gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (isEdit ? '수정 중...' : '생성 중...') : (isEdit ? '브랜드 수정' : '브랜드 생성')}
        </button>
        {onCancel && (
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded mt-2"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}