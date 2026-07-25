'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type OrderStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Order {
    id: string;
    code: string;
    customer: string;
    product: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    status: OrderStatus;
    createdAt: string;
}

const mockOrders: Order[] = Array.from({ length: 25 }, (_, i) => {
    const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const s = statuses[i % statuses.length];
    return {
        id: String(i + 1),
        code: `#ORD-${String(100 + i).padStart(3, '0')}`,
        customer: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Hoàng Kim E', 'Vũ Thanh F', 'Đặng Thu G'][i % 7],
        product: ['Cao Gắm Thảo Dược', 'Trà Dây Túi Lọc', 'Sâm Ngọc Linh', 'Tinh Dầu Tràm Gió', 'Viên Uống Bổ Gan', 'Cao Ích Mẫu'][i % 6],
        total: Math.round(200_000 + Math.random() * 5_000_000),
        paymentMethod: i % 3 === 0 ? 'VNPAY' : i % 3 === 1 ? 'MOMO' : 'COD',
        paymentStatus: s === 'CANCELLED' ? 'REFUNDED' : s === 'DELIVERED' ? 'PAID' : 'UNPAID',
        status: s,
        createdAt: new Date(2026, 6, 1 + i).toISOString(),
    };
});

const statusTabs = [
    { key: 'ALL' as const, label: 'Tất cả' },
    { key: 'PENDING' as const, label: 'Chờ xác nhận' },
    { key: 'CONFIRMED' as const, label: 'Đã xác nhận' },
    { key: 'PROCESSING' as const, label: 'Đang xử lý' },
    { key: 'SHIPPED' as const, label: 'Đang giao' },
    { key: 'DELIVERED' as const, label: 'Đã giao' },
    { key: 'CANCELLED' as const, label: 'Đã hủy' },
];

const statusBadge: Record<OrderStatus, string> = {
    ALL: '',
    PENDING: 'bg-secondary-container text-on-secondary-container',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabel: Record<OrderStatus, string> = {
    ALL: '',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
};

const paymentBadge: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    UNPAID: 'bg-yellow-100 text-yellow-700',
    REFUNDED: 'bg-gray-100 text-gray-500',
};

const paymentLabel: Record<string, string> = {
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    REFUNDED: 'Đã hoàn tiền',
};

export default function AdminOrdersPage() {
    const [filterTab, setFilterTab] = useState<OrderStatus>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const filtered = useMemo(() => {
        let list = mockOrders;
        if (filterTab !== 'ALL') {
            list = list.filter((o) => o.status === filterTab);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((o) => o.code.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
        }
        return list;
    }, [filterTab, search]);

    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = { ALL: mockOrders.length };
        statusTabs.slice(1).forEach((t) => {
            counts[t.key] = mockOrders.filter((o) => o.status === t.key).length;
        });
        return counts;
    }, []);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Đơn hàng</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Quản lý Đơn hàng</h2>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-outline-variant pb-3">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => { setFilterTab(tab.key); setPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-caption font-bold transition-colors ${filterTab === tab.key
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                            }`}
                    >
                        {tab.label}
                        {tab.key !== 'ALL' && (
                            <span className={`ml-1.5 ${filterTab === tab.key ? 'text-on-primary/70' : 'text-on-surface-variant/60'}`}>
                                ({tabCounts[tab.key]})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 material-symbols-outlined text-[20px]">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm bg-surface-white transition-all"
                        placeholder="Tìm theo mã đơn, tên khách hàng..."
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
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Mã đơn</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Khách hàng</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-5 py-4 text-right font-label-bold text-[12px] uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Thanh toán</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Trạng thái</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Ngày đặt</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {paged.map((order) => (
                                <tr key={order.id} className="hover:bg-surface-container-lowest/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <span className="font-label-bold text-primary text-body-sm">{order.code}</span>
                                    </td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface">{order.customer}</td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant max-w-[160px] truncate">{order.product}</td>
                                    <td className="px-5 py-4 text-right text-body-sm font-semibold text-primary">{order.total.toLocaleString('vi-VN')}₫</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${paymentBadge[order.paymentStatus] || ''}`}>
                                            {paymentLabel[order.paymentStatus] || order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${statusBadge[order.status]}`}>
                                            {statusLabel[order.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors text-caption font-bold"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            Xem
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center text-on-surface-variant text-body-sm">
                                        <span className="material-symbols-outlined text-4xl text-outline mb-3 block">receipt_long</span>
                                        Không tìm thấy đơn hàng nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
                        <p className="text-caption text-on-surface-variant">
                            <span className="font-semibold text-primary">{(page - 1) * pageSize + 1}</span>
                            {' – '}
                            <span className="font-semibold text-primary">{Math.min(page * pageSize, filtered.length)}</span>
                            {' / '}{filtered.length} đơn hàng
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
