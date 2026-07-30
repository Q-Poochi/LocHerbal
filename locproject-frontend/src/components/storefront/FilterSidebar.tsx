'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { id: 'tim-mach', name: 'Tim Mạch' },
  { id: 'xuong-khop', name: 'Xương Khớp' },
  { id: 'tieu-hoa', name: 'Tiêu Hóa' },
  { id: 'an-than-ngu-ngon', name: 'An Thần' },
];

const DOSAGES = [
  { id: 'vien-nen', name: 'Viên nén' },
  { id: 'vien-nang', name: 'Viên nang' },
  { id: 'cao-long', name: 'Cao lỏng' },
  { id: 'bot', name: 'Bột' },
];

const ORIGINS = [
  { id: 'viet-nam', name: 'Việt Nam' },
  { id: 'nhap-khau', name: 'Nhập khẩu' },
];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* Collapse states */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    categories: false,
    price: false,
    dosage: false,
    origin: false,
    rating: false,
  });

  const toggleCollapse = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  /* URL query param helper */
  const updateUrlParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset to page 1 on filter update
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/products?${params.toString()}`);
  };

  /* Toggle array values for checkboxes (e.g. dosage) */
  const toggleCheckboxParam = (key: string, value: string) => {
    const currentVal = searchParams.get(key);
    if (currentVal === value) {
      updateUrlParams(key, null); // toggle off
    } else {
      updateUrlParams(key, value); // set new
    }
  };

  const activeCategoryId = searchParams.get('categoryId') || '';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeDosage = searchParams.get('dosage') || '';
  const activeOrigin = searchParams.get('origin') || '';
  const activeRating = searchParams.get('rating') || '';

  return (
    <aside className="w-full md:w-[260px] flex-shrink-0 space-y-6 bg-white p-5 rounded-2xl border border-border sticky top-24 self-start">
      {/* ── DANH MỤC ────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => toggleCollapse('categories')}
          className="flex w-full justify-between items-center font-display font-bold text-sm uppercase tracking-wider text-text-primary mb-4"
        >
          <span>Danh mục</span>
          <span className={`material-symbols-outlined text-text-secondary transition-transform duration-250 ${collapsed.categories ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${collapsed.categories ? 'max-h-0' : 'max-h-56'}`}>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => updateUrlParams('categoryId', null)}
                className={`flex items-center w-full text-left py-1 text-sm transition-colors
                  ${!activeCategoryId ? 'text-primary-700 font-semibold' : 'text-text-secondary hover:text-primary-600'}`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 transition-transform duration-200 ${!activeCategoryId ? 'bg-primary-500 scale-100' : 'bg-transparent scale-0'}`} />
                Tất cả sản phẩm
              </button>
            </li>
            {CATEGORIES.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => updateUrlParams('categoryId', cat.id)}
                  data-testid={`nav-category-${cat.id}`}
                  className={`flex items-center w-full text-left py-1 text-sm transition-colors
                    ${activeCategoryId === cat.id ? 'text-primary-700 font-semibold' : 'text-text-secondary hover:text-primary-600'}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 transition-transform duration-200 ${activeCategoryId === cat.id ? 'bg-primary-500 scale-100' : 'bg-transparent scale-0'}`} />
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── KHOẢNG GIÁ ───────────────────────────────────────── */}
      <div className="pt-5 border-t border-border">
        <button
          onClick={() => toggleCollapse('price')}
          className="flex w-full justify-between items-center font-display font-bold text-sm uppercase tracking-wider text-text-primary mb-4"
        >
          <span>Khoảng giá</span>
          <span className={`material-symbols-outlined text-text-secondary transition-transform duration-250 ${collapsed.price ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${collapsed.price ? 'max-h-0' : 'max-h-64'}`}>
          <div className="space-y-4 pt-1">
            {/* Inputs min-max */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Từ (đ)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={activeMinPrice}
                    onChange={e => updateUrlParams('minPrice', e.target.value)}
                    className="w-full pl-3 pr-2 py-2.5 text-sm border border-border rounded-xl bg-surface-bg text-text-primary
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Đến (đ)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="500K"
                    value={activeMaxPrice}
                    onChange={e => updateUrlParams('maxPrice', e.target.value)}
                    className="w-full pl-3 pr-2 py-2.5 text-sm border border-border rounded-xl bg-surface-bg text-text-primary
                               focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Dưới 200K', min: '', max: '200000' },
                { label: '200K - 500K', min: '200000', max: '500000' },
                { label: 'Trên 500K', min: '500000', max: '' },
              ].map(preset => {
                const isSelected = activeMinPrice === preset.min && activeMaxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      updateUrlParams('minPrice', preset.min);
                      updateUrlParams('maxPrice', preset.max);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-95
                      ${isSelected
                        ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                        : 'bg-white text-text-secondary border-border hover:border-primary-500 hover:text-primary-700'}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── DẠNG BÀO CHẾ ─────────────────────────────────────── */}
      <div className="pt-5 border-t border-border">
        <button
          onClick={() => toggleCollapse('dosage')}
          className="flex w-full justify-between items-center font-display font-bold text-sm uppercase tracking-wider text-text-primary mb-4"
        >
          <span>Dạng bào chế</span>
          <span className={`material-symbols-outlined text-text-secondary transition-transform duration-250 ${collapsed.dosage ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${collapsed.dosage ? 'max-h-0' : 'max-h-56'}`}>
          <div className="space-y-2.5">
            {DOSAGES.map(ds => (
              <label key={ds.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={activeDosage === ds.id}
                  onChange={() => toggleCheckboxParam('dosage', ds.id)}
                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500 accent-primary-700"
                />
                <span className={`text-sm transition-colors ${activeDosage === ds.id ? 'text-primary-700 font-semibold' : 'text-text-secondary group-hover:text-text-primary'}`}>
                  {ds.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── XUẤT XỨ ─────────────────────────────────────────── */}
      <div className="pt-5 border-t border-border">
        <button
          onClick={() => toggleCollapse('origin')}
          className="flex w-full justify-between items-center font-display font-bold text-sm uppercase tracking-wider text-text-primary mb-4"
        >
          <span>Xuất xứ</span>
          <span className={`material-symbols-outlined text-text-secondary transition-transform duration-250 ${collapsed.origin ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${collapsed.origin ? 'max-h-0' : 'max-h-40'}`}>
          <div className="space-y-2.5">
            {ORIGINS.map(org => (
              <label key={org.id} className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={activeOrigin === org.id}
                  onChange={() => toggleCheckboxParam('origin', org.id)}
                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500 accent-primary-700"
                />
                <span className={`text-sm transition-colors ${activeOrigin === org.id ? 'text-primary-700 font-semibold' : 'text-text-secondary group-hover:text-text-primary'}`}>
                  {org.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── ĐÁNH GIÁ ─────────────────────────────────────────── */}
      <div className="pt-5 border-t border-border">
        <button
          onClick={() => toggleCollapse('rating')}
          className="flex w-full justify-between items-center font-display font-bold text-sm uppercase tracking-wider text-text-primary mb-4"
        >
          <span>Đánh giá</span>
          <span className={`material-symbols-outlined text-text-secondary transition-transform duration-250 ${collapsed.rating ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${collapsed.rating ? 'max-h-0' : 'max-h-40'}`}>
          <div className="space-y-2">
            {[5, 4].map(stars => (
              <button
                key={stars}
                onClick={() => updateUrlParams('rating', activeRating === stars.toString() ? null : stars.toString())}
                className={`flex items-center gap-2 w-full p-1.5 rounded-lg transition-all duration-150 hover:bg-primary-50
                  ${activeRating === stars.toString() ? 'bg-primary-50/70' : ''}`}
              >
                <span className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      className={`material-symbols-outlined text-sm ${s <= stars ? 'text-accent-gold' : 'text-gray-200'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </span>
                <span className={`text-xs ${activeRating === stars.toString() ? 'text-primary-700 font-semibold' : 'text-text-secondary'}`}>
                  từ {stars} sao
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => router.push('/products')}
        className="w-full py-3 px-4 border border-primary-700 text-primary-700 font-semibold text-sm rounded-xl
                   hover:bg-primary-50 transition-all flex items-center justify-center gap-2 mt-6 active:scale-95"
      >
        <span className="material-symbols-outlined text-base">filter_alt_off</span>
        Xóa tất cả lọc
      </button>
    </aside>
  );
}