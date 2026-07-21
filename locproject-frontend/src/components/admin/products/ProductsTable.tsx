'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductStatusBadge from './ProductStatusBadge';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    categoryColor: string;
    variants: string;
    priceRange: string;
    stock: number;
    stockLabel: string;
    stockColor: string;
    status: 'published' | 'draft';
    createdAt: string;
}

const mockProducts: Product[] = [
    { id: '1', name: 'Cao Atiso Nguyên Chất', sku: 'LH-AT-001', category: 'Hỗ Trợ Gan', categoryColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', variants: '2 quy cách', priceRange: '360.000 - 680.000 đ', stock: 142, stockLabel: 'Còn hàng', stockColor: 'text-success-leaf', status: 'published', createdAt: '12/05/2023' },
    { id: '2', name: 'Trà Thảo Mộc Tiêu Hóa', sku: 'LH-TE-042', category: 'Tiêu Hóa', categoryColor: 'bg-secondary-fixed text-on-secondary-fixed-variant', variants: '1 quy cách', priceRange: '185.000 đ', stock: 12, stockLabel: 'Sắp hết', stockColor: 'text-secondary', status: 'draft', createdAt: '28/08/2023' },
    { id: '3', name: 'Viên Nang Bổ Tim Mạch', sku: 'LH-TM-088', category: 'Tim Mạch', categoryColor: 'bg-error-container text-on-error-container', variants: '3 quy cách', priceRange: '520.000 - 1.250.000 đ', stock: 480, stockLabel: 'Còn hàng', stockColor: 'text-success-leaf', status: 'published', createdAt: '02/09/2023' },
    { id: '4', name: 'Tinh Dầu Tràm Gió', sku: 'LH-ES-015', category: 'Xương Khớp', categoryColor: 'bg-primary-fixed text-on-primary-fixed-variant', variants: '2 quy cách', priceRange: '95.000 - 180.000 đ', stock: 67, stockLabel: 'Còn hàng', stockColor: 'text-success-leaf', status: 'published', createdAt: '15/06/2023' },
    { id: '5', name: 'Cao Ích Mẫu', sku: 'LH-IM-022', category: 'Tiêu Hóa', categoryColor: 'bg-secondary-fixed text-on-secondary-fixed-variant', variants: '1 quy cách', priceRange: '220.000 đ', stock: 0, stockLabel: 'Hết hàng', stockColor: 'text-error-alert', status: 'draft', createdAt: '20/07/2023' },
    { id: '6', name: 'Trà Gừng Mật Ong', sku: 'LH-TG-031', category: 'Hỗ Trợ Gan', categoryColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', variants: '1 quy cách', priceRange: '150.000 đ', stock: 34, stockLabel: 'Còn hàng', stockColor: 'text-success-leaf', status: 'published', createdAt: '05/10/2023' },
    { id: '7', name: 'Viên Uống Bổ Gan', sku: 'LH-BG-077', category: 'Hỗ Trợ Gan', categoryColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', variants: '2 quy cách', priceRange: '280.000 - 520.000 đ', stock: 89, stockLabel: 'Còn hàng', stockColor: 'text-success-leaf', status: 'published', createdAt: '18/11/2023' },
    { id: '8', name: 'Sâm Ngọc Linh Cao Cấp', sku: 'LH-SN-099', category: 'Tim Mạch', categoryColor: 'bg-error-container text-on-error-container', variants: '3 quy cách', priceRange: '2.500.000 - 8.900.000 đ', stock: 25, stockLabel: 'Sắp hết', stockColor: 'text-secondary', status: 'draft', createdAt: '01/12/2023' },
];

type SortField = 'name' | 'category' | 'priceRange' | 'stock' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function ProductsTable() {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sorted = [...mockProducts].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
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

    return (
        <>
            <div className="bg-white rounded-xl table-shadow overflow-hidden mb-8 border border-outline-variant/30">
                <table className="w-full border-collapse">
                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="p-4 text-left w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-white/30 bg-transparent focus:ring-secondary-container text-secondary-container"
                                    checked={selected.size === sorted.length && sorted.length > 0}
                                    onChange={toggleAll}
                                />
                            </th>
                            <th className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left">Hình</th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('name')}
                            >
                                Tên sản phẩm{sortIndicator('name')}
                            </th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('category')}
                            >
                                Danh mục{sortIndicator('category')}
                            </th>
                            <th className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left">Biến thể</th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('priceRange')}
                            >
                                Giá niêm yết{sortIndicator('priceRange')}
                            </th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-center cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('stock')}
                            >
                                Tồn kho{sortIndicator('stock')}
                            </th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-center cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('status')}
                            >
                                Trạng thái{sortIndicator('status')}
                            </th>
                            <th
                                className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-left cursor-pointer hover:opacity-80"
                                onClick={() => toggleSort('createdAt')}
                            >
                                Ngày tạo{sortIndicator('createdAt')}
                            </th>
                            <th className="p-4 font-label-bold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                        {sorted.map((product) => (
                            <tr
                                key={product.id}
                                className="hover:bg-surface-container-lowest transition-colors group"
                            >
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        className="product-check rounded border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer"
                                        checked={selected.has(product.id)}
                                        onChange={() => toggleOne(product.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant/50 overflow-hidden" />
                                </td>
                                <td className="p-4">
                                    <p className="font-label-bold text-primary group-hover:underline cursor-pointer">
                                        {product.name}
                                    </p>
                                    <p className="text-caption text-on-surface-variant">SKU: {product.sku}</p>
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-[12px] font-semibold ${product.categoryColor}`}
                                    >
                                        {product.category}
                                    </span>
                                </td>
                                <td className="p-4 text-body-sm text-on-surface-variant italic">
                                    {product.variants}
                                </td>
                                <td className="p-4 text-body-sm font-semibold text-primary">
                                    {product.priceRange}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-body-sm font-bold">{product.stock}</span>
                                        <span className={`text-[10px] font-bold ${product.stockColor}`}>
                                            {product.stockLabel}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <ProductStatusBadge status={product.status} />
                                </td>
                                <td className="p-4 text-body-sm text-on-surface-variant">
                                    {product.createdAt}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-lg">
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        </button>
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-lg inline-flex"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </Link>
                                        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-lg">
                                            <span className="material-symbols-outlined text-[18px]">
                                                {product.status === 'published' ? 'toggle_on' : 'toggle_off'}
                                            </span>
                                        </button>
                                        <button className="p-1.5 text-error hover:bg-error-container/20 transition-all rounded-lg">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/30">
                    <p className="text-caption text-on-surface-variant">
                        Hiển thị 1 - {sorted.length} trên tổng số 128 sản phẩm
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-on-surface-variant disabled:opacity-30" disabled>
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-[12px] font-bold">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-[12px] font-bold">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-[12px] font-bold">3</button>
                        <span className="px-1 text-[12px]">...</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-[12px] font-bold">13</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Bulk Actions Bar */}
            <div
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary-container text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 transition-transform duration-300 z-50 ${selected.size > 0 ? 'translate-y-0' : 'translate-y-24'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="bg-secondary-container text-on-secondary-container w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px]">
                        {selected.size}
                    </span>
                    <span className="font-label-bold">Sản phẩm đã chọn</span>
                </div>
                <div className="h-6 w-[1px] bg-white/20" />
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-white hover:text-secondary-fixed transition-colors text-body-sm font-semibold">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                        </span>
                        Xuất bản
                    </button>
                    <button className="flex items-center gap-2 text-white hover:text-secondary-fixed transition-colors text-body-sm font-semibold">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            visibility_off
                        </span>
                        Ẩn
                    </button>
                    <button className="flex items-center gap-2 text-error-alert hover:text-red-300 transition-colors text-body-sm font-semibold">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            delete_sweep
                        </span>
                        Xóa
                    </button>
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