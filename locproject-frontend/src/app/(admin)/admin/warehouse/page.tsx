'use client';

import { useState, useMemo } from 'react';

interface StockItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    inStock: number;
    reserved: number;
    minThreshold: number;
    lastUpdated: string;
}

const mock: StockItem[] = [
    { id: '1', name: 'Cao Gắm Thảo Dược 500g', sku: 'CG-500', category: 'Cao thảo dược', inStock: 120, reserved: 5, minThreshold: 20, lastUpdated: '24/07/2026' },
    { id: '2', name: 'Trà Dây Túi Lọc 20 túi', sku: 'TD-20', category: 'Trà thảo dược', inStock: 250, reserved: 12, minThreshold: 50, lastUpdated: '24/07/2026' },
    { id: '3', name: 'Viên Uống Bổ Gan Hộp 60v', sku: 'VB-60', category: 'Viên uống', inStock: 45, reserved: 3, minThreshold: 30, lastUpdated: '23/07/2026' },
    { id: '4', name: 'Tinh Dầu Tràm 30ml', sku: 'TD-TRAM30', category: 'Tinh dầu', inStock: 18, reserved: 2, minThreshold: 15, lastUpdated: '22/07/2026' },
    { id: '5', name: 'Dung Dịch Vệ Sinh Phụ Nữ 250ml', sku: 'DD-VS250', category: 'Dung dịch vệ sinh', inStock: 8, reserved: 1, minThreshold: 20, lastUpdated: '24/07/2026' },
    { id: '6', name: 'Cao Ích Mẫu 300g', sku: 'CIM-300', category: 'Cao thảo dược', inStock: 60, reserved: 0, minThreshold: 15, lastUpdated: '20/07/2026' },
    { id: '7', name: 'Trà Atiso Túi Lọc 25 túi', sku: 'TA-25', category: 'Trà thảo dược', inStock: 5, reserved: 0, minThreshold: 30, lastUpdated: '19/07/2026' },
    { id: '8', name: 'Viên Uống An Thần 30v', sku: 'VAT-30', category: 'Viên uống', inStock: 90, reserved: 7, minThreshold: 25, lastUpdated: '24/07/2026' },
];

export default function WarehousePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showImport, setShowImport] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const pageSize = 6;

    const filtered = useMemo(() => {
        if (!search.trim()) return mock;
        const q = search.toLowerCase();
        return mock.filter((i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q)
        );
    }, [search]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const totalInStock = mock.reduce((s, i) => s + i.inStock, 0);
    const totalReserved = mock.reduce((s, i) => s + i.reserved, 0);
    const outOfStock = mock.filter((i) => i.inStock <= i.minThreshold).length;
    const canSell = totalInStock - totalReserved;

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                <span>Kho hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Tồn kho</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Kho hàng</h2>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowImport(true)}
                        className="flex items-center gap-1.5 bg-surface-white border border-outline-variant text-primary px-4 py-2.5 rounded-xl font-label-bold hover:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Nhập kho
                    </button>
                    <button onClick={() => setShowExport(true)}
                        className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                        Xuất kho
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Tổng tồn kho', value: totalInStock, icon: 'warehouse', color: 'bg-primary/10 text-primary' },
                    { label: 'Có thể bán', value: canSell, icon: 'check_circle', color: 'bg-green-100 text-green-700' },
                    { label: 'Đã đặt trước', value: totalReserved, icon: 'bookmark', color: 'bg-blue-100 text-blue-700' },
                    { label: 'Sắp hết (≤ ngưỡng)', value: outOfStock, icon: 'warning', color: 'bg-orange-100 text-orange-700' },
                ].map((stat) => (
                    <div key={stat.label} className={`p-4 rounded-xl ${stat.color} flex items-center gap-3`}>
                        <span className="material-symbols-outlined text-[26px]">{stat.icon}</span>
                        <div>
                            <p className="text-caption font-bold uppercase opacity-70">{stat.label}</p>
                            <p className="text-[22px] font-bold mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 material-symbols-outlined text-[20px]">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm bg-surface-white transition-all"
                        placeholder="Tìm theo tên sản phẩm, SKU..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary text-white">
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">SKU</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Danh mục</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Tồn kho</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Đã đặt</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Có thể bán</th>
                                <th className="px-5 py-4 text-right font-label-bold text-[12px] uppercase tracking-wider">Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {paged.map((item) => {
                                const sellable = item.inStock - item.reserved;
                                const low = item.inStock <= item.minThreshold;
                                return (
                                    <tr key={item.id} className={`hover:bg-surface-container-lowest/60 transition-colors ${low ? 'bg-orange-50/30' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-[20px]">package_2</span>
                                                </div>
                                                <span className="font-label-bold text-primary text-body-sm">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-body-sm text-on-surface-variant font-mono">{item.sku}</td>
                                        <td className="px-5 py-4 text-body-sm text-on-surface-variant">{item.category}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`font-bold ${low ? 'text-red-600' : 'text-primary'}`}>{item.inStock}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center text-body-sm text-on-surface-variant">{item.reserved}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`font-bold ${sellable <= 0 ? 'text-red-600' : 'text-green-600'}`}>{sellable}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right text-body-sm text-on-surface-variant">{item.lastUpdated}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
                        <p className="text-caption text-on-surface-variant">
                            <span className="font-semibold text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-primary">{Math.min(page * pageSize, filtered.length)}</span> / {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${p === page ? 'bg-primary text-white shadow-sm' : 'hover:bg-white text-on-surface-variant'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Import/Export modals placeholder */}
            {(showImport || showExport) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowImport(false); setShowExport(false); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">{showImport ? 'add_circle' : 'remove_circle'}</span>
                            <h3 className="font-headline-md text-headline-md text-primary">{showImport ? 'Nhập kho' : 'Xuất kho'}</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Sản phẩm</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm bg-white">
                                    <option>Chọn sản phẩm</option>
                                    {mock.map((i) => <option key={i.id}>{i.name} ({i.sku})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Số lượng</label>
                                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm" placeholder="0" min={1} />
                            </div>
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Ghi chú</label>
                                <textarea className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm" rows={3} placeholder="Lý do nhập/xuất..." />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button onClick={() => { setShowImport(false); setShowExport(false); }}
                                className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors">
                                Hủy
                            </button>
                            <button onClick={() => { setShowImport(false); setShowExport(false); }}
                                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
