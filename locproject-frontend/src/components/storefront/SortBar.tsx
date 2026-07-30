'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const FILTER_LABELS: Record<string, string> = {
  'tim-mach': 'Tim Mạch',
  'xuong-khop': 'Xương Khớp',
  'tieu-hoa': 'Tiêu Hóa',
  'an-than-ngu-ngon': 'An Thần',
  'vien-nen': 'Viên nén',
  'vien-nang': 'Viên nang',
  'cao-long': 'Cao lỏng',
  'bot': 'Bột',
  'viet-nam': 'Việt Nam',
  'nhap-khau': 'Nhập khẩu',
};

export default function SortBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };

  const handleRemoveFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleClearAll = () => {
    router.push('/products');
  };

  /* Build list of active filter chips */
  const activeChips: { key: string; label: string }[] = [];

  const cat = searchParams.get('categoryId');
  if (cat && FILTER_LABELS[cat]) {
    activeChips.push({ key: 'categoryId', label: FILTER_LABELS[cat] });
  }

  const min = searchParams.get('minPrice');
  const max = searchParams.get('maxPrice');
  if (min || max) {
    if (min && max) {
      activeChips.push({ key: 'price', label: `${Number(min).toLocaleString('vi-VN')} - ${Number(max).toLocaleString('vi-VN')}đ` });
    } else if (min) {
      activeChips.push({ key: 'minPrice', label: `Từ ${Number(min).toLocaleString('vi-VN')}đ` });
    } else if (max) {
      activeChips.push({ key: 'maxPrice', label: `Dưới ${Number(max).toLocaleString('vi-VN')}đ` });
    }
  }

  const dosage = searchParams.get('dosage');
  if (dosage && FILTER_LABELS[dosage]) {
    activeChips.push({ key: 'dosage', label: FILTER_LABELS[dosage] });
  }

  const origin = searchParams.get('origin');
  if (origin && FILTER_LABELS[origin]) {
    activeChips.push({ key: 'origin', label: FILTER_LABELS[origin] });
  }

  const rating = searchParams.get('rating');
  if (rating) {
    activeChips.push({ key: 'rating', label: `Từ ${rating} sao` });
  }

  const search = searchParams.get('search');
  if (search) {
    activeChips.push({ key: 'search', label: `Tìm: "${search}"` });
  }

  const currentSort = searchParams.get('sort') || 'popular';

  return (
    <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-border mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Active chips row */}
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.length > 0 ? (
            <>
              <span className="text-xs font-semibold text-text-secondary">Bộ lọc hoạt động:</span>
              {activeChips.map(chip => (
                <div
                  key={chip.key}
                  className="flex items-center gap-1 bg-primary-50 border border-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  <span>{chip.label}</span>
                  <button
                    onClick={() => {
                      if (chip.key === 'price') {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('minPrice');
                        params.delete('maxPrice');
                        router.push(`/products?${params.toString()}`);
                      } else {
                        handleRemoveFilter(chip.key);
                      }
                    }}
                    className="hover:bg-primary-100 p-0.5 rounded-full inline-flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs leading-none">close</span>
                  </button>
                </div>
              ))}
              <button
                onClick={handleClearAll}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline px-2 py-1"
              >
                Xóa tất cả
              </button>
            </>
          ) : (
            <span className="text-xs text-text-tertiary">Không có bộ lọc nào được áp dụng</span>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-text-secondary font-medium whitespace-nowrap">Sắp xếp:</span>
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="text-xs font-semibold text-primary-700 border border-border rounded-lg bg-surface px-2.5 py-1.5 focus:outline-none cursor-pointer focus:border-primary-500"
          >
            <option value="popular">Phổ biến nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}