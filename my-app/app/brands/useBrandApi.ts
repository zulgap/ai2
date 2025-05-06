// useBrandApi.ts
export function useBrandApi() {
  const createBrand = async (brandData: any) => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandData),
    });
    if (!res.ok) throw new Error('브랜드 생성 실패');
    return await res.json();
  };

  const updateBrand = async (id: string, brandData: any) => {
    const res = await fetch(`/api/brands/${id}`, {
      method: 'PATCH', // ← PATCH로 변경
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandData),
    });
    if (!res.ok) throw new Error('브랜드 업데이트 실패');
    return await res.json();
  };

  return { createBrand, updateBrand };
}

export async function checkBrandNameExists(name: string): Promise<boolean> {
  const res = await fetch(`/api/brands/check-name?name=${encodeURIComponent(name)}`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.exists;
}