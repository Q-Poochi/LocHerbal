'use client';

import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/lib/hooks/useProducts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useToast } from '@/lib/providers/toast-provider';
import { useEffect, useState } from 'react';
import { resolveCartItemImage } from '@/lib/utils/imageUrl';
import type { CartItem } from '@/types/api.types';

export default function CartPage() {
    const { data: cart, isLoading, error } = useCart();
    const updateQuantityMutation = useUpdateCartItem();
    const removeItemMutation = useRemoveFromCart();
    const router = useRouter();
    const { user } = useAuthStore();
    const toast = useToast();
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [forcedError, setForcedError] = useState(false);

    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => setForcedError(true), 8000);
            return () => clearTimeout(timer);
        }
        setForcedError(false);
    }, [isLoading]);

    const updateQuantity = (variantId: string, qty: number) => {
        if (qty < 1) return;
        updateQuantityMutation.mutate(
            { variantId, qty },
            { onError: () => toast.error('Cập nhật số lượng thất bại') }
        );
    };

    const removeItem = async (variantId: string) => {
        setRemovingId(variantId);
        removeItemMutation.mutate(variantId, {
            onSuccess: () => {
                toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
                setRemovingId(null);
            },
            onError: () => {
                toast.error('Xóa sản phẩm thất bại');
                setRemovingId(null);
            },
        });
    };

    const handleCheckout = () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thanh toán');
            router.push('/login?redirect=/cart');
            return;
        }
        router.push('/checkout');
    };

    /* ─── Login gate ─────────────────────────────────── */
    if (!user && !isLoading) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-16 flex items-center justify-center">
                    <div className="bg-white rounded-3xl shadow-card p-12 text-center max-w-md w-full border border-border">
                        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-5xl text-primary-300"
                                style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        </div>
                        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">Vui lòng đăng nhập</h1>
                        <p className="text-sm text-text-secondary mb-8">
                            Bạn cần đăng nhập để xem giỏ hàng và thực hiện mua hàng.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/login?redirect=/cart"
                                className="bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-800 transition-all text-sm"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="border border-border text-text-secondary px-8 py-3 rounded-xl font-semibold hover:bg-surface-bg transition-all text-sm"
                            >
                                Tạo tài khoản
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Loading ─────────────────────────────────────── */
    if (isLoading && !forcedError) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <div className="mb-8">
                        <div className="h-8 bg-primary-100 rounded-lg w-48 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                        <div className="bg-white rounded-3xl shadow-card p-6 space-y-4 border border-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b border-border last:border-0 animate-pulse">
                                    <div className="w-24 h-24 rounded-2xl bg-primary-50 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-primary-50 rounded-lg w-3/4" />
                                        <div className="h-4 bg-primary-50 rounded-lg w-1/2" />
                                        <div className="h-4 bg-primary-50 rounded-lg w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-3xl shadow-card p-6 border border-border animate-pulse h-fit">
                            <div className="h-6 bg-primary-50 rounded-lg w-1/2 mb-4" />
                            <div className="space-y-3">
                                <div className="h-4 bg-primary-50 rounded-lg w-full" />
                                <div className="h-4 bg-primary-50 rounded-lg w-full" />
                                <div className="h-12 bg-primary-100 rounded-xl w-full mt-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Error ───────────────────────────────────────── */
    if (error || forcedError) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <h1 className="font-display font-bold text-2xl text-text-primary mb-8">Giỏ hàng của bạn</h1>
                    <div className="bg-white rounded-3xl border border-red-100 p-12 text-center shadow-card">
                        <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">cloud_off</span>
                        <p className="text-lg text-text-primary font-semibold mb-2">Không thể tải giỏ hàng</p>
                        <p className="text-sm text-text-secondary mb-6">Vui lòng kiểm tra kết nối và thử lại.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-800 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            Tải lại trang
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Empty cart ──────────────────────────────────── */
    const items = Array.isArray(cart?.items) ? cart.items : [];

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-surface-bg">
                <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <h1 className="font-display font-bold text-2xl text-text-primary mb-8">Giỏ hàng của bạn</h1>
                    <div className="bg-white rounded-3xl shadow-card border border-border py-20 text-center">
                        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-5xl text-primary-300"
                                style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                        </div>
                        <p className="text-xl font-display font-bold text-text-primary mb-2">Giỏ hàng trống</p>
                        <p className="text-sm text-text-secondary mb-8">Chưa có mặt hàng nào trong giỏ hàng của bạn</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-800 transition-all text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Cart with items ─────────────────────────────── */
    const subtotal = items.reduce(
        (sum: number, item: CartItem) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
        0,
    );

    return (
        <div className="min-h-screen bg-surface-bg">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-primary-700 text-3xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                    <h1 className="font-display font-bold text-2xl text-text-primary">Giỏ hàng của bạn</h1>
                    <span className="ml-2 bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {items.length} sản phẩm
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

                    {/* ── Left: Cart Items ── */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-3xl shadow-card border border-border overflow-hidden">
                            {items.map((item: CartItem, idx: number) => {
                                const isRemoving = removingId === item.productVariantId;
                                return (
                                    <div
                                        key={item.id ?? item.productVariantId ?? idx}
                                        data-testid={`cart-item-${item.productVariantId ?? idx}`}
                                        className={`flex items-center gap-5 p-5 border-b border-border last:border-0 transition-all duration-300 ${isRemoving ? 'opacity-40 scale-95' : ''}`}
                                    >
                                        {/* Image */}
                                        <div className="w-24 h-24 rounded-2xl bg-primary-50 flex-shrink-0 overflow-hidden border border-primary-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={resolveCartItemImage(item) || '/placeholder.png'}
                                                className="w-full h-full object-cover"
                                                alt={item.productNameSnapshot ?? 'Sản phẩm'}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-display font-semibold text-text-primary text-base leading-tight mb-1 line-clamp-2">
                                                {item.productNameSnapshot ?? item.skuSnapshot ?? 'Sản phẩm'}
                                            </p>
                                            {item.variantName && (
                                                <p className="text-xs text-text-secondary mb-2 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">sell</span>
                                                    {item.variantName ?? item.skuSnapshot}
                                                </p>
                                            )}
                                            <p className="text-primary-700 font-bold text-base">
                                                {Number(item.priceSnapshot ?? item.unitPrice ?? 0).toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>

                                        {/* Quantity stepper */}
                                        <div className="flex items-center border border-border rounded-xl overflow-hidden flex-shrink-0 bg-surface-bg">
                                            <button
                                                onClick={() => updateQuantity(item.productVariantId, item.qty - 1)}
                                                disabled={item.qty <= 1 || updateQuantityMutation.isPending}
                                                className="w-10 h-10 flex items-center justify-center text-primary-700 hover:bg-primary-50 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                −
                                            </button>
                                            <span className="w-10 text-center text-sm font-semibold text-text-primary bg-white border-x border-border h-10 flex items-center justify-center">
                                                {item.qty}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.productVariantId, item.qty + 1)}
                                                disabled={updateQuantityMutation.isPending}
                                                className="w-10 h-10 flex items-center justify-center text-primary-700 hover:bg-primary-50 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Subtotal + Delete */}
                                        <div className="text-right flex-shrink-0 min-w-[100px]">
                                            <p className="font-bold text-primary-700 text-base">
                                                {(Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty).toLocaleString('vi-VN')}đ
                                            </p>
                                            <button
                                                onClick={() => removeItem(item.productVariantId)}
                                                disabled={isRemoving}
                                                className="mt-2 text-red-400 hover:text-red-600 transition-colors flex items-center gap-0.5 ml-auto text-xs disabled:opacity-40"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                                <span>Xóa</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Continue shopping */}
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-800 text-sm font-medium transition-colors group"
                        >
                            <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Tiếp tục mua sắm
                        </Link>
                    </div>

                    {/* ── Right: Order Summary ── */}
                    <div className="lg:sticky lg:top-28">
                        <div className="bg-white rounded-3xl shadow-card border border-border p-6 space-y-5">
                            <h2 className="font-display font-bold text-text-primary text-lg">Tóm tắt đơn hàng</h2>

                            {/* Line items preview */}
                            <div className="space-y-2">
                                {items.slice(0, 3).map((item: CartItem, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex-shrink-0 overflow-hidden border border-primary-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={resolveCartItemImage(item) || '/placeholder.png'}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <p className="flex-1 text-text-secondary truncate text-xs">
                                            {item.productNameSnapshot ?? 'Sản phẩm'} × {item.qty}
                                        </p>
                                        <p className="font-semibold text-text-primary text-xs flex-shrink-0">
                                            {(Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <p className="text-xs text-text-tertiary text-center">
                                        +{items.length - 3} sản phẩm khác
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-border pt-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Tạm tính ({items.length} SP)</span>
                                    <span className="font-semibold text-text-primary">{subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Phí vận chuyển</span>
                                    <span className="text-green-600 font-semibold">Miễn phí</span>
                                </div>
                            </div>

                            {/* Discount code */}
                            <div className="flex gap-2">
                                <input
                                    placeholder="Nhập mã giảm giá..."
                                    className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all text-text-primary placeholder:text-text-tertiary bg-surface-bg"
                                />
                                <button className="bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition-colors whitespace-nowrap">
                                    Áp dụng
                                </button>
                            </div>

                            {/* Total */}
                            <div className="border-t border-border pt-4 flex justify-between items-center">
                                <span className="font-display font-bold text-text-primary text-base">Tổng cộng</span>
                                <span className="font-display font-bold text-primary-700 text-2xl">
                                    {subtotal.toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            {/* Checkout button */}
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-accent-gold hover:bg-yellow-400 text-gray-900 font-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-base shadow-md hover:shadow-lg active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-xl"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>payment</span>
                                Tiến hành thanh toán
                            </button>

                            {/* Trust badges */}
                            <div className="text-center space-y-2">
                                <p className="text-xs text-text-tertiary flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-sm text-green-600">lock</span>
                                    Thanh toán bảo mật chuẩn SSL 256-bit
                                </p>
                                <div className="flex justify-center gap-2">
                                    {['VNPAY', 'MOMO', 'COD'].map((m) => (
                                        <span key={m} className="text-xs border border-border rounded-lg px-2.5 py-1 text-text-secondary font-medium">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
