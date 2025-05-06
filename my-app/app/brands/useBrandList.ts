import { useState, useEffect } from 'react';

export function useBrandList() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 추가: 상세/수정 상태 및 삭제 함수
  const [detail, setDetail] = useState<any>(null);
  const [editBrand, setEditBrand] = useState<any>(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brands'); // ← 실제 동작하는 API 경로로!
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : (data.brands || []));
    } catch (e) {
      setBrands([]);
    }
    setLoading(false);
  };

  // 삭제 함수 예시
  const handleDelete = async (id: string) => {
    await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    fetchBrands();
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    fetchBrands,
    detail,
    setDetail,
    editBrand,
    setEditBrand,
    handleDelete,
  };
}