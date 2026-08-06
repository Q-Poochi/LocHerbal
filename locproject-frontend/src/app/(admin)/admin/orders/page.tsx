'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

type OrderStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const statusTabs = [
    { key: 'ALL' as const, label: 'Tất cả' },
    { key: 'PENDING' as const, label: 'Chờ xác nhận' },
    { key: 'CONFIRMED' as const, label: 'Đã xác nhận' },
    { key: 'PROCESSING' as const, label: 'Đang xử lý' },
    { key: 'SHIPPED' as const, label: 'Đang giao' },
    { key: 'DELIVERED' as const, label: 'Đã giao' },
    { key: 'CANCELLED' as const, label: 'Đã hủy' },
];

const statusStyles: Record<string, string> = {
    PENDING: 'bg-primary-100 text-primary-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-amber-100 text-amber-700',
    SHIPPED: 'bg-violet-100 text-violet-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-slate-200 text-slate-700',
};

const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    REFUNDED: 'Đã hoàn tiền',
};

interface AdminOrder {
    id: string;
    orderCode: string;
    customer: { fullName?: string; phone?: string; email?: string } | null;
    items: { id: string; productNameSnapshot?: string }[];
    totalAmount: number;
    subtotal: number;
    status: string;
    paymentStatus?: string;
    paymentTxns?: { provider?: string; status?: string }[];
    createdAt: string;
}

interface OrderListResponse {
    data: AdminOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminOrdersPage() {
    const [filterTab, setFilterTab] = useState<OrderStatus>('ALL');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get<OrderListResponse>('/admin/orders', {
                params: {
                    page,
                    limit: 20,
                    ...(filterTab !== 'ALL' ? { status: filterTab } : {}),
                    ...(search ? { search } : {}),
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                },
            });
            setOrders(res.data.data);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải danh sách đơn hàng'));
        } finally {
            setLoading(false);
        }
    }, [page, filterTab, search, from, to]);

    useEffect(() => {
        load();
    }, [load]);

    const changeTab = (key: OrderStatus) => {
        setFilterTab(key);
        setPage(1);
    };

    const applySearch = () => {
        setSearch(searchInput.trim());
        setPage(1);
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setFrom('');
        setTo('');
        setFilterTab('ALL');
        setPage(1);
    };

    const hasFilters = Boolean(search || from || to || filterTab !== 'ALL');

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Đơn hàng</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Quản lý Đơn hàng</h2>
                <span className="text-sm text-text-tertiary bg-surface-alt px-3 py-1.5 rounded-lg">
                    {total.toLocaleString('vi-VN')} đơn hàng
                </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-border pb-3">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => changeTab(tab.key)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterTab === tab.key
                                ? 'bg-primary-700 text-white shadow-sm'
                                : 'text-text-tertiary hover:bg-surface-alt hover:text-primary-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search + Date range */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md bg-white rounded-xl border border-border px-3 py-2">
                    <span className="material-symbols-outlined text-[18px] text-text-tertiary">search</span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                        placeholder="Tìm mã đơn, tên KH, SĐT, email..."
                        className="flex-1 text-sm outline-none placeholder:text-text-tertiary"
                    />
                    {search && (
                        <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="text-text-tertiary hover:text-primary-700">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <span>Từ</span>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                        className="rounded-xl border border-border px-3 py-2 text-sm text-text-primary"
                    />
                    <span>đến</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => { setTo(e.target.value); setPage(1); }}
                        className="rounded-xl border border-border px-3 py-2 text-sm text-text-primary"
                    />
                </div>
                {hasFilters && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border text-sm font-bold text-text-secondary hover:border-primary-700 hover:text-primary-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-border p-16 text-center">
                    <span className="text-text-tertiary">Đang tải đơn hàng...</span>
                </div>
            ) : error ? (
                <div className="bg-white rounded-2xl shadow-sm border border-border p-16 text-center">
                    <p className="text-text-secondary font-medium">{error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                        <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">receipt_long</span>
                        <p className="text-text-secondary font-semibold text-base">Chưa có dữ liệu đơn hàng</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Mã đơn</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Khách hàng</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Sản phẩm</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Tổng tiền</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Thanh toán</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Ngày tạo</th>
                                    <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-surface-alt transition-colors">
                                        <td className="p-4 font-semibold text-primary-700">{order.orderCode}</td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-text-primary">{order.customer?.fullName || '—'}</p>
                                            <p className="text-xs text-text-tertiary">{order.customer?.phone || order.customer?.email || ''}</p>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary truncate max-w-[160px]">
                                            {order.items[0]?.productNameSnapshot || '—'}
                                            {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            {order.paymentStatus || '—'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${statusStyles[order.status] || 'bg-surface-alt text-text-tertiary'}`}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-text-tertiary">
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-surface-alt flex items-center justify-between border-t border-border">
                        <p className="text-xs text-text-tertiary">
                            Trang {page}/{Math.max(totalPages, 1)} · {total.toLocaleString('vi-VN')} đơn hàng
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
