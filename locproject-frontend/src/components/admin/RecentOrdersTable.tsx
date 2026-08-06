'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RecentOrder {
    id: string;
    orderCode: string;
    customer: { fullName?: string } | null;
    items?: { productNameSnapshot?: string }[];
    totalAmount: number;
    status: string;
    paymentStatus?: string;
}

interface OrderRow {
    id: string;
    code: string;
    customer: string;
    product: string;
    total: number;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
}

const statusStyles: Record<string, string> = {
    pending: 'bg-primary-100 text-primary-700',
    confirmed: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

const sortKeys: Record<string, keyof OrderRow> = {
    'Mã đơn': 'code',
    'Khách hàng': 'customer',
    'Sản phẩm': 'product',
    'Tổng cộng': 'total',
};

function mapStatus(status: string): OrderRow['status'] {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING' || s === 'PROCESSING') return 'pending';
    if (s === 'CONFIRMED') return 'confirmed';
    if (s === 'DELIVERED' || s === 'SHIPPED') return 'delivered';
    return 'cancelled';
}

export default function RecentOrdersTable({ orders = [] }: { orders?: RecentOrder[] }) {
    const [sortKey, setSortKey] = useState<keyof OrderRow>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const rows: OrderRow[] = orders.map((o) => ({
        id: o.id,
        code: o.orderCode || o.id,
        customer: o.customer?.fullName || '—',
        product: o.items?.[0]?.productNameSnapshot || '—',
        total: Number(o.totalAmount || 0),
        status: mapStatus(o.status),
    }));

    const sorted = [...rows].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    const handleSort = (label: string) => {
        const key = sortKeys[label];
        if (!key) return;
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return (
        <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-display font-bold text-lg text-text-primary">Đơn hàng gần đây</h4>
                <Link
                    href="/admin/orders"
                    className="text-primary-700 font-semibold text-sm hover:underline"
                >
                    Xem tất cả
                </Link>
            </div>
            {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-[40px] text-text-tertiary mb-3">receipt_long</span>
                    <p className="text-sm text-text-secondary">Chưa có đơn hàng nào.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-primary-700 text-white font-semibold text-xs">
                            <tr>
                                {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng cộng', 'Trạng thái', 'Action'].map(
                                    (header) => (
                                        <th
                                            key={header}
                                            className={`px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg uppercase ${sortKeys[header] ? 'cursor-pointer hover:opacity-80' : ''
                                                }`}
                                            onClick={() => sortKeys[header] && handleSort(header)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {header}
                                                {sortKeys[header] && sortKey === sortKeys[header] && (
                                                    <span className="text-[10px]">
                                                        {sortDir === 'asc' ? '▲' : '▼'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sorted.map((order) => (
                                <tr key={order.id} className="hover:bg-surface-alt transition-colors">
                                    <td className="px-4 py-4 font-semibold text-primary-700">{order.code}</td>
                                    <td className="px-4 py-4 text-sm text-text-primary">{order.customer}</td>
                                    <td className="px-4 py-4 text-sm text-text-secondary truncate max-w-[120px]">
                                        {order.product}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right font-bold">
                                        {order.total.toLocaleString('vi-VN')}đ
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${statusStyles[order.status]}`}
                                        >
                                            {statusLabels[order.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="p-1 text-primary-700 hover:bg-primary-100 rounded inline-flex transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                visibility
                                            </span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
