'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';

interface OrderListItem {
    id: string;
    orderCode: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    items: { id: string; productNameSnapshot: string; qty: number }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    PENDING:    { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700',  icon: 'schedule'      },
    CONFIRMED:  { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700',     icon: 'task_alt'      },
    PROCESSING: { label: 'Đang xử lý',   color: 'bg-purple-100 text-purple-700', icon: 'manufacturing' },
    SHIPPED:    { label: 'Đang giao',    color: 'bg-orange-100 text-orange-700', icon: 'local_shipping'},
    DELIVERED:  { label: 'Đã giao',      color: 'bg-green-100 text-green-700',   icon: 'verified'      },
    CANCELLED:  { label: 'Đã hủy',       color: 'bg-red-100 text-red-600',       icon: 'cancel'        },
    REFUNDED:   { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-700',     icon: 'assignment_return' },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
    UNPAID:   { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-700' },
    PAID:     { label: 'Đã thanh toán',   color: 'bg-green-100 text-green-700'   },
    REFUNDED: { label: 'Đã hoàn tiền',    color: 'bg-blue-100 text-blue-700'     },
};

export default function OrdersListPage() {
    const router = useRouter();
    const { user, hasHydrated } = useAuthStore();
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        if (hasHydrated && !user) {
            router.replace('/login?redirect=/orders');
            return;
        }
        if (!hasHydrated) return;

        setLoading(true);
        apiClient
            .get('/orders', { params: { page, limit: 10 } })
            .then(({ data }) => {
                setOrders(data.data || []);
                setTotalPages(data.totalPages || 1);
                setLoadError(false);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    }, [user, hasHydrated, page, router]);

    const formatCurrency = (v: number) => Number(v).toLocaleString('vi-VN') + 'đ';
    const formatDate = (d: string) =>
        new Date(d).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    /* ─── Loading ─── */
    if (!hasHydrated || loading) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-primary-50 rounded-lg w-48" />
                        <div className="h-24 bg-primary-50 rounded-2xl" />
                        <div className="h-24 bg-primary-50 rounded-2xl" />
                        <div className="h-24 bg-primary-50 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Lỗi tải (mạng/API) ─── */
    if (loadError) {
        return (
            <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <span className="material-symbols-outlined text-red-400 text-5xl mb-4">cloud_off</span>
                    <p className="font-display font-semibold text-lg text-text-primary mb-2">Không tải được đơn hàng</p>
                    <p className="text-sm text-text-secondary mb-6">Vui lòng thử lại sau ít phút.</p>
                    <button
                        onClick={() => setPage((p) => p)}
                        className="px-6 py-3 rounded-full bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    /* ─── Rỗng ─── */
    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-primary-300 text-4xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                    </div>
                    <p className="font-display font-bold text-xl text-text-primary mb-2">Bạn chưa có đơn hàng nào</p>
                    <p className="text-sm text-text-secondary mb-6">Khám phá các sản phẩm thảo dược của LocHerbal nhé!</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800"
                    >
                        <span className="material-symbols-outlined text-lg">storefront</span>
                        Mua sắm ngay
                    </Link>
                </div>
            </div>
        );
    }

    /* ─── Danh sách ─── */
    return (
        <div className="min-h-screen bg-surface-bg">
            <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
                    <Link href="/account" className="hover:text-primary-700 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">person</span>
                        Tài khoản
                    </Link>
                    <span className="material-symbols-outlined text-base text-text-tertiary">chevron_right</span>
                    <span className="text-text-primary font-medium">Đơn hàng của tôi</span>
                </nav>

                {/* Header */}
                <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-700 text-3xl">receipt_long</span>
                    Đơn hàng của tôi
                </h1>

                {/* Danh sách */}
                <div className="space-y-4">
                    {orders.map((o) => {
                        const sInfo = statusConfig[o.status] ?? { label: o.status, color: 'bg-gray-100 text-gray-600', icon: 'info' };
                        const pInfo = paymentConfig[o.paymentStatus] ?? { label: o.paymentStatus, color: 'bg-gray-100 text-gray-600' };
                        const itemCount = o.items?.reduce((sum, it) => sum + it.qty, 0) ?? 0;
                        const previewNames = o.items?.slice(0, 2).map((it) => it.productNameSnapshot).join(', ') ?? '';
                        const moreCount = (o.items?.length ?? 0) - 2;
                        return (
                            <Link
                                key={o.id}
                                href={`/orders/${o.id}`}
                                data-testid={`order-item-${o.orderCode}`}
                                className="block bg-white rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary-200 transition-all"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-text-primary text-sm mb-1">
                                            #{o.orderCode}
                                        </p>
                                        <p className="text-xs text-text-secondary">{formatDate(o.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sInfo.color}`}>
                                            <span className="material-symbols-outlined text-sm">{sInfo.icon}</span>
                                            {sInfo.label}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${pInfo.color}`}>
                                            {pInfo.label}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-text-secondary mt-3 truncate">
                                    {previewNames}
                                    {moreCount > 0 && ` +${moreCount} sản phẩm khác`}
                                    <span className="text-text-tertiary"> · {itemCount} món</span>
                                </p>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                    <span className="text-xs text-text-tertiary">
                                        {o.items?.length ?? 0} sản phẩm
                                    </span>
                                    <span className="font-display font-bold text-primary-700">
                                        Tổng: {formatCurrency(o.totalAmount)}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-4 py-2 rounded-full border border-border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-text-secondary">Trang {page}/{totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-full border border-border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}