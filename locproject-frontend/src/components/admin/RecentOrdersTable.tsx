'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Order {
    id: string;
    code: string;
    customer: string;
    product: string;
    total: number;
    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
}

const mockOrders: Order[] = [
    { id: '1', code: '#ORD-102', customer: 'Nguyễn Văn A', product: 'Cao Gắm Thảo...', total: 1_250_000, status: 'pending' },
    { id: '2', code: '#ORD-098', customer: 'Trần Thị B', product: 'Trà dây túi lọc', total: 450_000, status: 'delivered' },
    { id: '3', code: '#ORD-095', customer: 'Lê Hoàng C', product: 'Sâm Ngọc Linh', total: 8_900_000, status: 'confirmed' },
];

const statusStyles: Record<string, string> = {
    pending: 'bg-secondary-container text-on-secondary-container',
    confirmed: 'bg-primary-fixed-dim/40 text-primary-container',
    delivered: 'bg-success-leaf/20 text-success-leaf',
    cancelled: 'bg-error-container text-on-error-container',
};

const statusLabels: Record<string, string> = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

const sortKeys: Record<string, keyof Order> = {
    'Mã đơn': 'code',
    'Khách hàng': 'customer',
    'Sản phẩm': 'product',
    'Tổng cộng': 'total',
};

export default function RecentOrdersTable() {
    const [sortKey, setSortKey] = useState<keyof Order>('code');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sorted = [...mockOrders].sort((a, b) => {
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
        <div className="lg:col-span-6 bg-surface-white p-6 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-headline-md font-bold text-primary">Đơn hàng gần đây</h4>
                <Link
                    href="/admin/orders"
                    className="text-secondary font-label-bold text-body-sm hover:underline"
                >
                    Xem tất cả
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-primary text-on-primary font-label-bold text-caption">
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
                    <tbody className="divide-y divide-outline-variant">
                        {sorted.map((order) => (
                            <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                                <td className="px-4 py-4 font-label-bold text-primary">{order.code}</td>
                                <td className="px-4 py-4 text-body-sm">{order.customer}</td>
                                <td className="px-4 py-4 text-body-sm truncate max-w-[120px]">
                                    {order.product}
                                </td>
                                <td className="px-4 py-4 text-body-sm text-right font-bold">
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
                                        className="p-1 text-primary hover:bg-primary/10 rounded inline-flex transition-colors"
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
        </div>
    );
}