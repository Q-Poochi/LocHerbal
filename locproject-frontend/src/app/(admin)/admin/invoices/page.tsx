'use client';

import { useState, useMemo } from 'react';

interface InvoiceRequest {
    id: string;
    order: string;
    customer: string;
    company: string;
    taxCode: string;
    amount: number;
    status: 'REQUESTED' | 'ISSUED' | 'CANCELLED';
    createdAt: string;
}

const mock: InvoiceRequest[] = [
    { id: '1', order: '#ORD-102', customer: 'Nguyễn Văn A', company: 'Công ty TNHH ABC', taxCode: '0123456789', amount: 985000, status: 'REQUESTED', createdAt: '24/07/2026' },
    { id: '2', order: '#ORD-100', customer: 'Trần Thị Bích', company: 'DNTN Bích Trần', taxCode: '0987654321', amount: 1250000, status: 'ISSUED', createdAt: '23/07/2026' },
    { id: '3', order: '#ORD-097', customer: 'Lê Hoàng Cường', company: 'Công ty TNHH Hoàng Cường', taxCode: '0777888999', amount: 2100000, status: 'ISSUED', createdAt: '22/07/2026' },
    { id: '4', order: '#ORD-095', customer: 'Phạm Minh Đức', company: '', taxCode: '', amount: 1800000, status: 'REQUESTED', createdAt: '21/07/2026' },
    { id: '5', order: '#ORD-092', customer: 'Hoàng Kim Ngân', company: 'Công ty CP Kim Ngân', taxCode: '0666555444', amount: 3200000, status: 'CANCELLED', createdAt: '20/07/2026' },
];

const statusBadge: Record<string, string> = {
    REQUESTED: 'bg-orange-100 text-orange-700',
    ISSUED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
    REQUESTED: 'Chờ xuất',
    ISSUED: 'Đã xuất',
    CANCELLED: 'Đã hủy',
};

export default function InvoicesPage() {
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const totalPages = Math.ceil(mock.length / pageSize);
    const paged = mock.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Hóa đơn</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Yêu cầu xuất hóa đơn</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Hóa đơn</h2>
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>{mock.filter((r) => r.status === 'REQUESTED').length} yêu cầu chờ xử lý</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary text-white">
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Đơn hàng</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Khách hàng</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Công ty</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Mã số thuế</th>
                                <th className="px-5 py-4 text-right font-label-bold text-[12px] uppercase tracking-wider">Số tiền</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Trạng thái</th>
                                <th className="px-5 py-4 text-right font-label-bold text-[12px] uppercase tracking-wider">Ngày yêu cầu</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {paged.map((r) => (
                                <tr key={r.id} className="hover:bg-surface-container-lowest/60 transition-colors">
                                    <td className="px-5 py-4 font-label-bold text-primary text-body-sm">{r.order}</td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{r.customer}</td>
                                    <td className="px-5 py-4 text-body-sm">{r.company || <span className="text-outline italic">Cá nhân</span>}</td>
                                    <td className="px-5 py-4 text-body-sm font-mono">{r.taxCode || <span className="text-outline italic">—</span>}</td>
                                    <td className="px-5 py-4 text-right text-body-sm font-bold text-primary">{r.amount.toLocaleString('vi-VN')}₫</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${statusBadge[r.status]}`}>{statusLabel[r.status]}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right text-body-sm text-on-surface-variant">{r.createdAt}</td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {r.status === 'REQUESTED' && (
                                                <>
                                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors text-caption font-bold">
                                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                        Xuất
                                                    </button>
                                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-caption font-bold">
                                                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                                                        Hủy
                                                    </button>
                                                </>
                                            )}
                                            {r.status === 'ISSUED' && (
                                                <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors text-caption font-bold">
                                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                                    Tải về
                                                </button>
                                            )}
                                            {r.status === 'CANCELLED' && (
                                                <span className="text-caption text-outline italic">Đã hủy</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
                        <p className="text-caption text-on-surface-variant">
                            <span className="font-semibold text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-primary">{Math.min(page * pageSize, mock.length)}</span> / {mock.length}
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
        </div>
    );
}
