'use client';

import { useState } from 'react';

export interface ProductFilters {
    search: string;
    category: string;
    status: 'all' | 'published' | 'draft';
}

interface ProductFilterBarProps {
    onChange: (filters: ProductFilters) => void;
}

const categories = [
    'Tất cả danh mục',
    'Tim Mạch',
    'Tiêu Hóa',
    'Hỗ Trợ Gan',
    'Xương Khớp',
];

export default function ProductFilterBar({ onChange }: ProductFilterBarProps) {
    const [filters, setFilters] = useState<ProductFilters>({
        search: '',
        category: 'Tất cả danh mục',
        status: 'all',
    });

    const update = (partial: Partial<ProductFilters>) => {
        const next = { ...filters, ...partial };
        setFilters(next);
        onChange(next);
    };

    return (
        <div className="bg-white p-4 rounded-xl table-shadow mb-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    search
                </span>
                <input
                    className="w-full border-outline-variant focus:border-primary-container focus:ring-primary-container rounded-lg pl-10 text-body-sm"
                    placeholder="Tìm tên, SKU, hoặc từ khóa..."
                    type="text"
                    value={filters.search}
                    onChange={(e) => update({ search: e.target.value })}
                />
            </div>
            <div className="flex items-center gap-3">
                <select
                    className="border-outline-variant focus:border-primary-container focus:ring-primary-container rounded-lg text-body-sm min-w-[160px]"
                    value={filters.category}
                    onChange={(e) => update({ category: e.target.value })}
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <div className="flex p-1 bg-surface-container-low rounded-lg border border-outline-variant">
                    {(['all', 'published', 'draft'] as const).map((s) => (
                        <button
                            key={s}
                            className={`px-4 py-1.5 rounded-md text-caption font-semibold transition-all ${filters.status === s
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-on-surface-variant hover:text-primary'
                                }`}
                            onClick={() => update({ status: s })}
                        >
                            {s === 'all' ? 'Tất cả' : s === 'published' ? 'Công bố' : 'Bản nháp'}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <input
                        className="border-outline-variant focus:border-primary-container focus:ring-primary-container rounded-lg text-body-sm"
                        type="date"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    Lọc thêm
                </button>
            </div>
        </div>
    );
}