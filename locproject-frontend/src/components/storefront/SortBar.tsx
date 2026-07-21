'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SortBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'module' | 'list'>('grid');

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const sortMap: Record<string, string> = {
      'Phổ biến nhất': 'popular',
      'Giá: Thấp đến Cao': 'price_asc',
      'Giá: Cao đến Thấp': 'price_desc',
      'Mới nhất': 'newest',
    };

    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortMap[value] || 'popular');
    router.push(`/products?${params.toString()}`);
  };

  const handleRemoveFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filter);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-white p-4 rounded-xl shadow-soft mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm font-medium text-outline">Lọc theo:</span>
        {searchParams.get('dosage') && (
          <div className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-caption">
            <span>{searchParams.get('dosage')}</span>
            <span className="material-symbols-outlined text-[14px] cursor-pointer" onClick={() => handleRemoveFilter('dosage')}>close</span>
          </div>
        )}
        {searchParams.get('maxPrice') && (
          <div className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-caption">
            <span>Dưới {searchParams.get('maxPrice')}đ</span>
            <span className="material-symbols-outlined text-[14px] cursor-pointer" onClick={() => handleRemoveFilter('maxPrice')}>close</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-outline">Sắp xếp:</span>
          <select
            className="border-none bg-transparent text-body-sm font-bold text-primary focus:ring-0 cursor-pointer"
            onChange={handleSortChange}
          >
            <option>Phổ biến nhất</option>
            <option>Giá: Thấp đến Cao</option>
            <option>Giá: Cao đến Thấp</option>
            <option>Mới nhất</option>
          </select>
        </div>

        <div className="h-6 w-px bg-outline-variant"></div>

        <div className="flex items-center gap-2">
          <button
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary-fixed text-primary' : 'text-outline hover:bg-surface-container-low'}`}
            onClick={() => setViewMode('grid')}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === 'module' ? 'bg-primary-fixed text-primary' : 'text-outline hover:bg-surface-container-low'}`}
            onClick={() => setViewMode('module')}
          >
            <span className="material-symbols-outlined text-[20px]">view_module</span>
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary-fixed text-primary' : 'text-outline hover:bg-surface-container-low'}`}
            onClick={() => setViewMode('list')}
          >
            <span className="material-symbols-outlined text-[20px]">view_list</span>
          </button>
        </div>
      </div>
    </div>
  );
}