'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductStatusBadge from './ProductStatusBadge';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface Variant {
    id: string;
    name?: string;
    price?: number;
}

interface ApiProduct {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
    category?: { id: string; name: string } | null;
    variants?: Variant[];
    isPublished: boolean;
    createdAt: string;
}

interface ProductRow {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string;
    category: string;
    variantCount: number;
    priceRange: string;
    status: 'published' | 'draft';
    createdAt: string;
}

type SortField = 'name' | 'category' | 'priceRange' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function formatPrice(n: number): string {
    return n.toLocaleString('vi-VN') + 'đ';
}

function toRows(products: ApiProduct[]): ProductRow[] {
    return products.map((p) => {
        const prices = (p.variants || [])
            .map((v) => Number(v.price || 0))
            .filter((n) => n > 0);
        const min = prices.length ? Math.min(...prices) : 0;
        const max = prices.length ? Math.max(...prices) : 0;
        const priceRange = prices.length === 0
            ? '—'
            : min === max
                ? formatPrice(min)
                : `${formatPrice(min)} - ${formatPrice(max)}`;
        return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            thumbnailUrl: p.thumbnailUrl || '',
            category: p.category?.name || '—',
            variantCount: (p.variants || []).length,
            priceRange,
            status: p.isPublished ? 'published' : 'draft',
            createdAt: p.createdAt,
        };
    });
}

export default function ProductsTable() {
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    useEffect(() => {
        async function load() {
            try {
                const res = await apiClient.get('/products', { params: { limit: 50, sort: 'newest' } });
                const data = res.data?.data ?? [];
                setProducts(toRows(data));
                setTotal(res.data?.totalCount ?? data.length);
            } catch (e) {
                setError(getErrorMessage(e, 'Không thể tải danh sách sản phẩm'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sorted = [...products].sort((a, b) => {
        const aVal = String(a[sortField]);
        const bVal = String(b[sortField]);
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const toggleAll = () => {
        if (selected.size === sorted.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(sorted.map((p) => p.id)));
        }
    };

    const toggleOne = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const sortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return <span className="text-[10px] ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    if (loading) {
        return (
            <div className="admin-card p-16 text-center">
                <span className="text-text-tertiary">Đang tải sản phẩm...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-card p-16 text-center">
                <p className="text-text-secondary font-medium">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="admin-card overflow-hidden mb-8">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="p-4 text-left w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-white/30 bg-transparent"
                                    checked={selected.size === sorted.length && sorted.length > 0}
                                    onChange={toggleAll}
                                />
                            </th>
                            <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Hình</th>
                            <th
                                className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('name')}
                            >
                                Tên sản phẩm{sortIndicator('name')}
                            </th>
                            <th
                                className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('category')}
                            >
                                Danh mục{sortIndicator('category')}
                            </th>
                            <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Biến thể</th>
                            <th
                                className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('priceRange')}
                            >
                                Giá niêm yết{sortIndicator('priceRange')}
                            </th>
                            <th
                                className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('status')}
                            >
                                Trạng thái{sortIndicator('status')}
                            </th>
                            <th
                                className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('createdAt')}
                            >
                                Ngày tạo{sortIndicator('createdAt')}
                            </th>
                            <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-16 text-center">
                                    <p className="text-text-secondary">Chưa có sản phẩm nào.</p>
                                </td>
                            </tr>
                        ) : (
                            sorted.map((product) => (
                                <tr
                                    key={product.id}
                                    className="hover:bg-surface-alt transition-colors group"
                                >
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border text-primary-700"
                                            checked={selected.has(product.id)}
                                            onChange={() => toggleOne(product.id)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        {product.thumbnailUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnailUrl}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover border border-border"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-surface-alt border border-border flex items-center justify-center">
                                                <span className="material-symbols-outlined text-text-tertiary">local_pharmacy</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <p className="font-semibold text-primary group-hover:underline cursor-pointer">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-text-tertiary">Slug: {product.slug}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-primary-100 text-primary-700">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-text-tertiary italic">
                                        {product.variantCount} quy cách
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-primary">
                                        {product.priceRange}
                                    </td>
                                    <td className="p-4 text-center">
                                        <ProductStatusBadge status={product.status} />
                                    </td>
                                    <td className="p-4 text-sm text-text-tertiary">
                                        {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/products/${product.slug}`}
                                                className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </Link>
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="p-4 bg-surface-alt flex items-center justify-between border-t border-border">
                    <p className="text-xs text-text-tertiary">
                        Hiển thị {sorted.length} trên tổng số {total} sản phẩm
                    </p>
                </div>
            </div>

            {/* Floating Bulk Actions Bar */}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary-700 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 transition-transform duration-300 z-50 ${selected.size > 0 ? 'translate-y-0' : 'translate-y-24'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px]">
                        {selected.size}
                    </span>
                    <span className="font-semibold">Sản phẩm đã chọn</span>
                </div>
                <button
                    className="p-1 hover:bg-white/10 rounded-full transition-colors ml-4"
                    onClick={() => setSelected(new Set())}
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
        </>
    );
}
