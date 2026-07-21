'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    categories: false,
    price: false,
    dosage: false,
    origin: false,
    rating: false,
  });

  const toggleCollapse = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateUrlParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newUrl = `/products?${params.toString()}`;
    console.log('[FilterSidebar] router.push:', newUrl, 'searchParams before:', searchParams.toString());
    router.push(newUrl);
  };

  return (
    <aside className="w-full md:w-[280px] flex-shrink-0 space-y-8">
      {/* Categories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-outline">Danh mục</h3>
          <span
            className="material-symbols-outlined text-outline cursor-pointer select-none"
            onClick={() => toggleCollapse('categories')}
          >
            {collapsed.categories ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
        </div>
        {!collapsed.categories && (
          <ul className="space-y-2">
            <li data-testid="nav-category-xuong-khop" className="flex justify-between items-center group cursor-pointer" onClick={() => updateUrlParams('categoryId', 'xuong-khop')}>
              <span className="text-body-md text-on-surface-variant group-hover:text-primary">Xương khớp</span>
              <span className="text-caption text-outline">2</span>
            </li>
            <li data-testid="nav-category-tim-mach" className="flex justify-between items-center group cursor-pointer" onClick={() => updateUrlParams('categoryId', 'tim-mach')}>
              <span className="text-body-md text-on-surface-variant group-hover:text-primary">Tim Mạch</span>
              <span className="text-caption text-outline">2</span>
            </li>
            <li data-testid="nav-category-tieu-hoa" className="flex justify-between items-center group cursor-pointer" onClick={() => updateUrlParams('categoryId', 'tieu-hoa')}>
              <span className="text-body-md text-on-surface-variant group-hover:text-primary">Tiêu hóa</span>
              <span className="text-caption text-outline">2</span>
            </li>
            <li data-testid="nav-category-an-than-ngu-ngon" className="flex justify-between items-center group cursor-pointer" onClick={() => updateUrlParams('categoryId', 'an-than-ngu-ngon')}>
              <span className="text-body-md text-on-surface-variant group-hover:text-primary">An thần, ngủ ngon</span>
              <span className="text-caption text-outline">2</span>
            </li>
          </ul>
        )}
      </div>

      {/* Price Range */}
      <div className="pt-4 border-t border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-outline">Khoảng giá</h3>
          <span
            className="material-symbols-outlined text-outline cursor-pointer select-none"
            onClick={() => toggleCollapse('price')}
          >
            {collapsed.price ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
        </div>
        {!collapsed.price && (
          <div className="px-2">
            <input
              className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              max="5000000"
              min="0"
              step="50000"
              type="range"
              defaultValue="5000000"
              onChange={(e) => updateUrlParams('maxPrice', e.target.value)}
            />
            <div className="flex items-center justify-between mt-4 gap-2">
              <div className="flex-1">
                <label className="text-caption text-outline block mb-1">Tối thiểu</label>
                <input
                  className="w-full text-body-sm border-outline-variant rounded px-2 py-1 focus:border-primary focus:ring-0"
                  type="text"
                  defaultValue="0"
                  onChange={(e) => updateUrlParams('minPrice', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-caption text-outline block mb-1">Tối đa</label>
                <input
                  className="w-full text-body-sm border-outline-variant rounded px-2 py-1 focus:border-primary focus:ring-0"
                  type="text"
                  defaultValue="5000000"
                  onChange={(e) => updateUrlParams('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dosage Form */}
      <div className="pt-4 border-t border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-outline">Dạng bào chế</h3>
          <span
            className="material-symbols-outlined text-outline cursor-pointer select-none"
            onClick={() => toggleCollapse('dosage')}
          >
            {collapsed.dosage ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
        </div>
        {!collapsed.dosage && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('dosage', 'vien-nen')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Viên nén</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('dosage', 'vien-nang')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Viên nang</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('dosage', 'cao-long')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Cao lỏng</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('dosage', 'bot')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Bột</span>
            </label>
          </div>
        )}
      </div>

      {/* Origin */}
      <div className="pt-4 border-t border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-outline">Xuất xứ</h3>
          <span
            className="material-symbols-outlined text-outline cursor-pointer select-none"
            onClick={() => toggleCollapse('origin')}
          >
            {collapsed.origin ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
        </div>
        {!collapsed.origin && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('origin', 'viet-nam')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Việt Nam</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" type="checkbox" onChange={() => updateUrlParams('origin', 'nhap-khau')} />
              <span className="text-body-md text-on-surface-variant group-hover:text-on-surface">Nhập khẩu</span>
            </label>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="pt-4 border-t border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-outline">Đánh giá</h3>
          <span
            className="material-symbols-outlined text-outline cursor-pointer select-none"
            onClick={() => toggleCollapse('rating')}
          >
            {collapsed.rating ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
          </span>
        </div>
        {!collapsed.rating && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 hover:bg-surface-container-low w-full p-1 rounded transition-colors text-secondary" onClick={() => updateUrlParams('rating', '5')}>
              <span className="flex">
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </span>
              <span className="text-body-sm text-on-surface-variant">từ 5 sao</span>
            </button>
            <button className="flex items-center gap-2 hover:bg-surface-container-low w-full p-1 rounded transition-colors text-secondary" onClick={() => updateUrlParams('rating', '4')}>
              <span className="flex">
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]">star</span>
              </span>
              <span className="text-body-sm text-on-surface-variant">từ 4 sao</span>
            </button>
          </div>
        )}
      </div>

      <button
        className="w-full py-3 px-4 border border-outline text-on-surface font-label-bold text-body-sm rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2 mt-8 active:scale-95"
        onClick={() => router.push('/products')}
      >
        <span className="material-symbols-outlined">filter_alt_off</span>
        Xóa bộ lọc
      </button>
    </aside>
  );
}