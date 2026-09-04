'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface ApiInvoice {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    taxAmount: number;
    issuedAt: string;
    order: { id: string; orderCode: string } | null;
}

interface InvoiceRow {
    id: string;
    order: string;
    invoiceNumber: string;
    amount: number;
    createdAt: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const load = useCallback(async (p: number) => {
        try {
            setLoading(true);
            const res = await apiClient.get('/accounting/invoices', { params: { page: p, limit: pageSize } });
            const data: ApiInvoice[] = res.data?.data ?? [];
            setInvoices(data.map((inv) => ({
                id: inv.id,
                order: inv.order?.orderCode || '—',
                invoiceNumber: inv.invoiceNumber,
                amount: Number(inv.totalAmount || 0),
                createdAt: new Date(inv.issuedAt).toLocaleDateString('vi-VN'),
            })));
            setTotal(res.data?.total ?? data.length);
            setError('');
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải danh sách hóa đơn'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [page, load]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Hóa đơn</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Yêu cầu xuất hóa đơn</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Quản lý Hóa đơn</h2>
                <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface-alt px-4 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>Tổng {total} hóa đơn</span>
                </div>
            </div>

            {error && (
                <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="admin-card overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="text-text-tertiary">Đang tải hóa đơn...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-primary text-white">
                                    <th className="px-5 py-4 text-left font-semibold text-[12px] uppercase tracking-wider">Số hóa đơn</th>
                                    <th className="px-5 py-4 text-left font-semibold text-[12px] uppercase tracking-wider">Đơn hàng</th>
                                    <th className="px-5 py-4 text-right font-semibold text-[12px] uppercase tracking-wider">Số tiền</th>
                                    <th className="px-5 py-4 text-right font-semibold text-[12px] uppercase tracking-wider">Thuế</th>
                                    <th className="px-5 py-4 text-right font-semibold text-[12px] uppercase tracking-wider">Ngày xuất</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center">
                                            <p className="text-text-secondary">Chưa có hóa đơn nào.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((r) => (
                                        <tr key={r.id} className="hover:bg-surface-alt transition-colors">
                                            <td className="px-5 py-4 font-semibold text-primary text-sm">{r.invoiceNumber}</td>
                                            <td className="px-5 py-4 text-sm text-text-secondary">{r.order}</td>
                                            <td className="px-5 py-4 text-right text-sm font-bold text-text-primary">{r.amount.toLocaleString('vi-VN')}₫</td>
                                            <td className="px-5 py-4 text-right text-sm text-text-tertiary">0₫</td>
                                            <td className="px-5 py-4 text-right text-sm text-text-tertiary">{r.createdAt}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-alt flex items-center justify-between border-t border-border">
                        <p className="text-xs text-text-tertiary">
                            <span className="font-semibold text-text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-text-primary">{Math.min(page * pageSize, total)}</span> / {total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-text-tertiary disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${p === page ? 'bg-primary-700 text-white shadow-sm' : 'hover:bg-white text-text-tertiary'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-text-tertiary disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
