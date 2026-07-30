'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
    id: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
}

interface OrderStatusHistory {
    id: string;
    status: string;
    note: string;
    createdAt: string;
}

interface Address {
    id: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
}

interface Order {
    id: string;
    orderCode: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    note: string;
    items: OrderItem[];
    statusHistory: OrderStatusHistory[];
    address: Address | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    PENDING:    { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700',  icon: 'schedule'         },
    CONFIRMED:  { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700',     icon: 'task_alt'          },
    PROCESSING: { label: 'Đang xử lý',   color: 'bg-purple-100 text-purple-700', icon: 'manufacturing'     },
    SHIPPED:    { label: 'Đang giao',    color: 'bg-orange-100 text-orange-700', icon: 'local_shipping'    },
    DELIVERED:  { label: 'Đã giao',      color: 'bg-green-100 text-green-700',   icon: 'verified'          },
    CANCELLED:  { label: 'Đã hủy',       color: 'bg-red-100 text-red-600',       icon: 'cancel'            },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
    UNPAID:   { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-700' },
    PAID:     { label: 'Đã thanh toán',   color: 'bg-green-100 text-green-700'   },
    REFUNDED: { label: 'Đã hoàn tiền',    color: 'bg-blue-100 text-blue-700'     },
};

const timelineOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelNote, setCancelNote] = useState('');
    const [showCancelInput, setShowCancelInput] = useState(false);

    useEffect(() => {
        if (!user) {
            router.replace('/login?redirect=/orders/' + id);
            return;
        }
        apiClient.get(`/orders/${id}`).then(({ data }) => {
            setOrder(data.data || data);
        }).catch(() => {
            router.push('/account');
        }).finally(() => setLoading(false));
    }, [id, user, router]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await apiClient.post(`/orders/${id}/cancel`, { note: cancelNote || undefined });
            const { data } = await apiClient.get(`/orders/${id}`);
            setOrder(data.data || data);
            setShowCancelInput(false);
        } catch {
            alert('Hủy đơn hàng thất bại');
        } finally {
            setCancelling(false);
        }
    };

    const formatCurrency = (v: number) => v.toLocaleString('vi-VN') + 'đ';
    const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-primary-50 rounded-lg w-56" />
                        <div className="h-10 bg-primary-50 rounded-2xl w-80" />
                        <div className="h-48 bg-primary-50 rounded-3xl" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-64 bg-primary-50 rounded-3xl" />
                            <div className="h-64 bg-primary-50 rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
    const currentIdx = timelineOrder.indexOf(order.status);
    const isCancelled = order.status === 'CANCELLED';
    const statusInfo = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600', icon: 'info' };
    const paymentInfo = paymentConfig[order.paymentStatus] ?? { label: order.paymentStatus, color: 'bg-gray-100 text-gray-600' };

    return (
        <div className="min-h-screen bg-surface-bg">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
                    <Link href="/account" className="hover:text-primary-700 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">person</span>
                        Tài khoản
                    </Link>
                    <span className="material-symbols-outlined text-base text-text-tertiary">chevron_right</span>
                    <span className="text-text-primary font-medium">Đơn hàng #{order.orderCode}</span>
                </nav>

                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
                            Đơn hàng #{order.orderCode}
                        </h1>
                        <p className="text-sm text-text-secondary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            Đặt ngày {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                            <span className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: "'FILL' 1" }}>{statusInfo.icon}</span>
                            {statusInfo.label}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${paymentInfo.color}`}>
                            {paymentInfo.label}
                        </span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl shadow-card border border-border p-6 mb-6">
                    <h3 className="font-display font-semibold text-text-primary mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-700 text-xl">route</span>
                        Trạng thái đơn hàng
                    </h3>

                    {isCancelled ? (
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                            <span className="material-symbols-outlined text-red-500 text-2xl"
                                style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                            <div>
                                <p className="font-semibold text-red-600">Đơn hàng đã bị hủy</p>
                                {order.statusHistory.find(h => h.status === 'CANCELLED')?.note && (
                                    <p className="text-sm text-red-400 mt-0.5">
                                        Lý do: {order.statusHistory.find(h => h.status === 'CANCELLED')?.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center overflow-x-auto pb-2 gap-0">
                            {timelineOrder.map((s, idx) => {
                                const done = idx <= currentIdx;
                                const active = s === order.status;
                                const cfg = statusConfig[s];
                                return (
                                    <div key={s} className="flex items-center min-w-0 flex-1">
                                        <div className="flex flex-col items-center min-w-[70px] md:min-w-[90px]">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                                                ${active ? 'bg-primary-700 text-white shadow-md ring-4 ring-primary-100'
                                                : done ? 'bg-primary-100 text-primary-700'
                                                : 'bg-gray-100 text-text-tertiary'}`}>
                                                <span className="material-symbols-outlined text-lg"
                                                    style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                                                    {done && !active ? 'check_circle' : cfg.icon}
                                                </span>
                                            </div>
                                            <span className={`mt-2 text-[10px] md:text-xs text-center leading-tight font-semibold
                                                ${active ? 'text-primary-700' : done ? 'text-primary-600' : 'text-text-tertiary'}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        {idx < timelineOrder.length - 1 && (
                                            <div className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-all
                                                ${idx < currentIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Items + History */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Products */}
                        <div className="bg-white rounded-3xl shadow-card border border-border p-6">
                            <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-700 text-xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                                Sản phẩm đã đặt ({order.items.length})
                            </h3>
                            <div className="divide-y divide-border">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-primary-300 text-xl"
                                                style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-text-primary text-sm leading-tight line-clamp-2">
                                                {item.productNameSnapshot}
                                            </p>
                                            <p className="text-xs text-text-tertiary mt-0.5">SKU: {item.skuSnapshot}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-text-secondary">× {item.qty}</p>
                                            <p className="font-bold text-primary-700 text-sm mt-0.5">
                                                {formatCurrency(item.unitPrice * item.qty)}
                                            </p>
                                            <p className="text-xs text-text-tertiary">
                                                {formatCurrency(item.unitPrice)}/sp
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status History */}
                        {order.statusHistory.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-card border border-border p-6">
                                <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-700 text-xl">history</span>
                                    Lịch sử cập nhật
                                </h3>
                                <div className="space-y-4">
                                    {order.statusHistory.map((h, idx) => {
                                        const hCfg = statusConfig[h.status];
                                        return (
                                            <div key={h.id} className="flex items-start gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                                                        ${hCfg?.color ?? 'bg-gray-100 text-gray-600'}`}>
                                                        <span className="material-symbols-outlined text-sm"
                                                            style={{ fontVariationSettings: "'FILL' 1" }}>
                                                            {hCfg?.icon ?? 'info'}
                                                        </span>
                                                    </div>
                                                    {idx < order.statusHistory.length - 1 && (
                                                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border" />
                                                    )}
                                                </div>
                                                <div className="pb-4">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-text-primary text-sm">
                                                            {hCfg?.label ?? h.status}
                                                        </span>
                                                        <span className="text-xs text-text-tertiary">{formatDate(h.createdAt)}</span>
                                                    </div>
                                                    {h.note && (
                                                        <p className="text-sm text-text-secondary mt-1">{h.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Cancel section */}
                        {canCancel && (
                            <div className="bg-red-50 rounded-3xl border border-red-100 p-6">
                                <h3 className="font-display font-semibold text-red-700 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xl">cancel</span>
                                    Hủy đơn hàng
                                </h3>
                                <p className="text-sm text-red-500 mb-4">
                                    Bạn có thể hủy đơn hàng khi đơn đang ở trạng thái chờ xác nhận hoặc đã xác nhận.
                                </p>
                                {!showCancelInput ? (
                                    <button
                                        onClick={() => setShowCancelInput(true)}
                                        className="px-5 py-2.5 rounded-xl border-2 border-red-400 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all"
                                    >
                                        Yêu cầu hủy đơn
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            value={cancelNote}
                                            onChange={e => setCancelNote(e.target.value)}
                                            className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 bg-white text-text-primary placeholder:text-text-tertiary resize-none"
                                            placeholder="Lý do hủy đơn (không bắt buộc)..."
                                            rows={2}
                                        />
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleCancel}
                                                disabled={cancelling}
                                                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                                            >
                                                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                                            </button>
                                            <button
                                                onClick={() => setShowCancelInput(false)}
                                                className="px-5 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-surface-bg transition-all"
                                            >
                                                Quay lại
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Summary + Address + Info */}
                    <div className="space-y-6">

                        {/* Price summary */}
                        <div className="bg-white rounded-3xl shadow-card border border-border p-6">
                            <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-700 text-xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                                Tổng tiền
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Tạm tính</span>
                                    <span className="font-medium text-text-primary">{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Giảm giá</span>
                                        <span className="text-green-600 font-semibold">-{formatCurrency(order.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Phí vận chuyển</span>
                                    <span className={order.shippingFee === 0 ? 'text-green-600 font-semibold' : 'text-text-primary'}>
                                        {order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Miễn phí'}
                                    </span>
                                </div>
                                <div className="border-t border-border pt-3 flex justify-between items-center">
                                    <span className="font-display font-bold text-text-primary">Thành tiền</span>
                                    <span className="font-display font-bold text-primary-700 text-xl">
                                        {formatCurrency(order.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping address */}
                        {order.address && (
                            <div className="bg-white rounded-3xl shadow-card border border-border p-6">
                                <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-700 text-xl"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                    Địa chỉ giao hàng
                                </h3>
                                <div className="space-y-1.5 text-sm">
                                    <p className="font-semibold text-text-primary">{order.address.recipientName}</p>
                                    <p className="text-text-secondary flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-text-tertiary">phone</span>
                                        {order.address.phone}
                                    </p>
                                    <p className="text-text-secondary flex items-start gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-text-tertiary mt-0.5">home</span>
                                        <span>
                                            {order.address.addressLine}
                                            {order.address.ward ? `, ${order.address.ward}` : ''}
                                            {order.address.district ? `, ${order.address.district}` : ''}
                                            , {order.address.province}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order info */}
                        <div className="bg-white rounded-3xl shadow-card border border-border p-6">
                            <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-700 text-xl">info</span>
                                Thông tin đơn hàng
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Mã đơn</span>
                                    <span className="font-bold text-primary-700">#{order.orderCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Ngày đặt</span>
                                    <span className="text-text-primary">{formatDate(order.createdAt)}</span>
                                </div>
                                {order.note && (
                                    <div>
                                        <span className="text-text-secondary">Ghi chú:</span>
                                        <p className="mt-1 text-text-primary italic text-xs bg-surface-bg rounded-lg p-2">
                                            {order.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <Link
                            href="/account"
                            className="flex items-center justify-center gap-2 w-full py-3 border border-border rounded-2xl text-sm font-semibold text-text-secondary hover:bg-surface-bg hover:text-primary-700 hover:border-primary-200 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Quay lại tài khoản
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
