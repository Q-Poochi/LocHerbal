'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface StockVariant {
    id: string;
    sku: string;
    name?: string;
    product?: { id: string; name?: string } | null;
}

interface StockItem {
    id: string;
    qtyOnHand: number;
    qtyReserved: number;
    available: number;
    reorderThreshold: number;
    isLowStock: boolean;
    variant: StockVariant;
    warehouse: { id: string; name?: string } | null;
}

interface WarehouseSummary {
    warehouseId: string;
    warehouseName: string;
    qtyOnHand: number;
    qtyReserved: number;
    available: number;
}

interface StockOverviewResponse {
    data: StockItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    warehouses: WarehouseSummary[];
}

export default function WarehousePage() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [summaries, setSummaries] = useState<WarehouseSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get<StockOverviewResponse>('/admin/warehouse/stock', {
                params: { page, limit: 20 },
            });
            setItems(res.data.data);
            setSummaries(res.data.warehouses);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải dữ liệu tồn kho'));
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                <span>Kho hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary-700 font-semibold">Tồn kho</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Quản lý Kho hàng</h2>
                <span className="text-sm text-text-tertiary bg-surface-alt px-3 py-1.5 rounded-lg">
                    {total.toLocaleString('vi-VN')} dòng tồn kho
                </span>
            </div>

            {loading ? (
                <div className="admin-card p-16 text-center">
                    <span className="text-text-tertiary">Đang tải tồn kho...</span>
                </div>
            ) : error ? (
                <div className="admin-card p-16 text-center">
                    <p className="text-text-secondary font-medium">{error}</p>
                </div>
            ) : items.length === 0 ? (
                <div className="admin-card overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                        <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">inventory_2</span>
                        <p className="text-text-secondary font-semibold text-base">Chưa có dữ liệu tồn kho</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Tổng hợp theo kho */}
                    {summaries.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {summaries.map((s) => (
                                <div key={s.warehouseId} className="admin-card p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-[20px] text-primary-700">warehouse</span>
                                        <p className="font-bold text-text-primary">{s.warehouseName}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-xs text-text-tertiary">Tồn thực tế</p>
                                            <p className="font-bold text-text-primary">{s.qtyOnHand}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-tertiary">Đã giữ</p>
                                            <p className="font-bold text-text-primary">{s.qtyReserved}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-tertiary">Có thể bán</p>
                                            <p className="font-bold text-green-600">{s.available}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="admin-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Sản phẩm</th>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Kho</th>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Tồn thực tế</th>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Đã giữ</th>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Có thể bán</th>
                                        <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-surface-alt transition-colors">
                                            <td className="p-4">
                                                <p className="font-semibold text-text-primary">{item.variant.product?.name || '—'}</p>
                                                <p className="text-xs text-text-tertiary">
                                                    {item.variant.name ? `${item.variant.name} · ` : ''}SKU: {item.variant.sku}
                                                </p>
                                            </td>
                                            <td className="p-4 text-sm text-text-secondary">{item.warehouse?.name || '—'}</td>
                                            <td className="p-4 text-sm font-semibold text-right">{item.qtyOnHand}</td>
                                            <td className="p-4 text-sm text-text-secondary text-right">{item.qtyReserved}</td>
                                            <td className="p-4 text-sm font-bold text-right">
                                                <span className={item.available <= 0 ? 'text-red-600' : 'text-green-600'}>{item.available}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.isLowStock ? (
                                                    <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-red-100 text-red-700">
                                                        Sắp hết
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-green-100 text-green-700">
                                                        Đủ hàng
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-surface-alt flex items-center justify-between border-t border-border">
                            <p className="text-xs text-text-tertiary">
                                Trang {page}/{Math.max(totalPages, 1)} · {total.toLocaleString('vi-VN')} dòng tồn kho
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-border text-sm font-bold text-text-secondary disabled:opacity-40 hover:border-primary-700 hover:text-primary-700 transition-colors"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-border text-sm font-bold text-text-secondary disabled:opacity-40 hover:border-primary-700 hover:text-primary-700 transition-colors"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
