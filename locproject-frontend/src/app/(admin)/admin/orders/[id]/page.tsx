'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

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

const nextStatusOptions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['REFUNDED'],
};

interface OrderItem {
    id: string;
    productVariantId: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
}

interface StatusHistoryEntry {
    id: string;
    status: string;
    note?: string;
    changedBy?: string;
    createdAt: string;
}

interface AdminOrderDetail {
    id: string;
    orderCode: string;
    customer: { id: string; fullName?: string; phone?: string; email?: string } | null;
    items: OrderItem[];
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    createdAt: string;
    address?: {
        recipientName?: string;
        phone?: string;
        addressLine?: string;
        ward?: string;
        district?: string;
        province?: string;
    } | null;
    statusHistory?: StatusHistoryEntry[];
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params?.id as string | undefined;

    const [order, setOrder] = useState<AdminOrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        async function load() {
            if (!orderId) return;
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.get<AdminOrderDetail>(`/admin/orders/${orderId}`);
                setOrder(res.data);
            } catch (e) {
                setError(getErrorMessage(e, 'Không tìm thấy thông tin đơn hàng'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [orderId]);

    const changeStatus = async (status: string) => {
        if (!orderId) return;
        setUpdating(true);
        setUpdateError('');
        try {
            const res = await apiClient.patch<AdminOrderDetail>(`/admin/orders/${orderId}/status`, { status });
            setOrder(res.data);
        } catch (e) {
            setUpdateError(getErrorMessage(e, 'Không thể cập nhật trạng thái'));
        } finally {
            setUpdating(false);
        }
    };

    const money = (n: number) => Number(n).toLocaleString('vi-VN') + 'đ';

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                        <Link href="/admin/orders" className="hover:text-primary-700 transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            Đơn hàng
                        </Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary-700 font-semibold">Chi tiết đơn hàng</span>
                    </nav>
                    <div className="flex items-center gap-3 mt-1">
                        <h2 className="font-display font-bold text-2xl text-text-primary">
                            {order ? order.orderCode : 'Chi tiết đơn hàng'}
                        </h2>
                        {order && (
                            <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${statusStyles[order.status] || 'bg-surface-alt text-text-tertiary'}`}>
                                {statusLabels[order.status] || order.status}
                            </span>
                        )}
                    </div>
                </div>
                <Link
                    href="/admin/orders"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-primary-700 hover:border-primary-700 transition-all text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </Link>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-border p-16 text-center">
                    <span className="text-text-tertiary">Đang tải đơn hàng...</span>
                </div>
            ) : error || !order ? (
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                        <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">receipt_long</span>
                        <p className="text-text-secondary font-semibold text-base">{error || 'Không tìm thấy thông tin đơn hàng'}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột trái: sản phẩm + khách hàng */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Sản phẩm */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-bold text-text-primary">Sản phẩm</h3>
                            </div>
                            <table className="w-full">
                                <tbody className="divide-y divide-border">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-text-primary">{item.productNameSnapshot}</p>
                                                <p className="text-xs text-text-tertiary">SKU: {item.skuSnapshot}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary text-right">
                                                {money(item.unitPrice)} × {item.qty}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-text-primary text-right">
                                                {money(item.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-6 py-4 border-t border-border space-y-1 text-sm bg-surface-alt/50">
                                <div className="flex justify-between text-text-secondary">
                                    <span>Tạm tính</span><span>{money(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-text-secondary">
                                    <span>Giảm giá</span><span>-{money(order.discountAmount)}</span>
                                </div>
                                <div className="flex justify-between text-text-secondary">
                                    <span>Phí ship</span><span>{money(order.shippingFee)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-text-primary pt-1 border-t border-border mt-1">
                                    <span>Tổng cộng</span><span>{money(order.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Khách hàng */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-bold text-text-primary">Khách hàng</h3>
                            </div>
                            <div className="px-6 py-4 space-y-1 text-sm">
                                <p className="font-semibold text-text-primary">{order.customer?.fullName || '—'}</p>
                                <p className="text-text-secondary">{order.customer?.phone || ''}</p>
                                <p className="text-text-secondary">{order.customer?.email || ''}</p>
                                {order.address && (
                                    <p className="text-text-secondary pt-2">
                                        {order.address.recipientName} · {order.address.phone} · {order.address.addressLine}, {order.address.ward || ''} {order.address.district || ''} {order.address.province || ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: trạng thái + lịch sử */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-bold text-text-primary">Cập nhật trạng thái</h3>
                            </div>
                            <div className="px-6 py-4 space-y-2">
                                <p className="text-sm text-text-tertiary">
                                    Thanh toán: <span className="font-semibold text-text-secondary">{order.paymentStatus || '—'}</span>
                                </p>
                                {(nextStatusOptions[order.status] || []).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {nextStatusOptions[order.status].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => changeStatus(s)}
                                                disabled={updating}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${s === 'CANCELLED' || s === 'REFUNDED'
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-primary-700 text-white hover:bg-primary-800'
                                                    }`}
                                            >
                                                {updating ? 'Đang cập nhật...' : `Chuyển → ${statusLabels[s]}`}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-tertiary">Không còn trạng thái chuyển tiếp.</p>
                                )}
                                {updateError && <p className="text-sm text-red-600">{updateError}</p>}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="px-6 py-4 border-b border-border">
                                <h3 className="font-bold text-text-primary">Lịch sử trạng thái</h3>
                            </div>
                            <div className="px-6 py-4 space-y-3">
                                {(order.statusHistory || []).length === 0 ? (
                                    <p className="text-sm text-text-tertiary">Chưa có lịch sử.</p>
                                ) : (
                                    (order.statusHistory || []).map((h) => (
                                        <div key={h.id} className="flex items-start gap-3">
                                            <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[h.status] || 'bg-surface-alt text-text-tertiary'}`}>
                                                {statusLabels[h.status] || h.status}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-xs text-text-tertiary">
                                                    {new Date(h.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                                {h.note && <p className="text-sm text-text-secondary">{h.note}</p>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
