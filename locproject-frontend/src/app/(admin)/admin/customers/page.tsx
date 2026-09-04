'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface AdminCustomer {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    createdAt: string;
    totalOrders: number;
    totalSpent: number;
}

interface CustomerListResponse {
    data: AdminCustomer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<AdminCustomer[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get<CustomerListResponse>('/admin/customers', {
                params: { page, limit: 20 },
            });
            setCustomers(res.data.data);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải danh sách khách hàng'));
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
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary-700 font-semibold">Khách hàng</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Quản lý Khách hàng</h2>
                <span className="text-sm text-text-tertiary bg-surface-alt px-3 py-1.5 rounded-lg">
                    {total.toLocaleString('vi-VN')} khách hàng
                </span>
            </div>

            {loading ? (
                <div className="admin-card p-16 text-center">
                    <span className="text-text-tertiary">Đang tải khách hàng...</span>
                </div>
            ) : error ? (
                <div className="admin-card p-16 text-center">
                    <p className="text-text-secondary font-medium">{error}</p>
                </div>
            ) : customers.length === 0 ? (
                <div className="admin-card overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                        <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">group</span>
                        <p className="text-text-secondary font-semibold text-base">Chưa có dữ liệu khách hàng</p>
                    </div>
                </div>
            ) : (
                <div className="admin-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Tên khách hàng</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Liên hệ</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Số đơn</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Tổng chi tiêu</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-surface-alt transition-colors">
                                        <td className="p-4">
                                            <p className="font-semibold text-text-primary">{customer.fullName}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-text-secondary">{customer.phone || '—'}</p>
                                            <p className="text-xs text-text-tertiary">{customer.email || ''}</p>
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-right">{customer.totalOrders}</td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            {Number(customer.totalSpent).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="p-4 text-sm text-text-tertiary">
                                            {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-surface-alt flex items-center justify-between border-t border-border">
                        <p className="text-xs text-text-tertiary">
                            Trang {page}/{Math.max(totalPages, 1)} · {total.toLocaleString('vi-VN')} khách hàng
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
            )}
        </div>
    );
}
