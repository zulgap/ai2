'use client';

import { useState } from 'react';
import BrandList from './BrandList';
import BrandForm from './BrandForm';

export default function BrandsPage() {
  const [editBrand, setEditBrand] = useState(null);
  const [brands, setBrands] = useState<any[]>([]); // ← 여기에!

  return (
    <div className="p-8">
      <BrandList onEdit={setEditBrand} />
      {/* <select>
        <option value="">브랜드 선택</option>
        {(Array.isArray(brands) ? brands : []).map((b: any) => (
          <option key={b.id} value={b.id}>{b.name || b.id}</option>
        ))}
      </select> */}
      {editBrand !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded shadow-lg min-w-[700px] max-w-3xl">
            <BrandForm
              editBrand={editBrand}
              onSave={() => setEditBrand(null)}
              onCancel={() => setEditBrand(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}