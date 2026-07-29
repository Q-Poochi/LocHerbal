'use client';

import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/lib/hooks/useProducts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useToast } from '@/lib/providers/toast-provider';
import { useEffect, useState } from 'react';

export default function CartPage() {
    const { data: cart, isLoading, error } = useCart();
    const updateQuantityMutation = useUpdateCartItem();
    const removeItemMutation = useRemoveFromCart();
    const router = useRouter();
    const { user } = useAuthStore();
    const toast = useToast();

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
        updateQuantityMutation.mutate({ variantId, qty });
    };

    const removeItem = (variantId: string) => {
        removeItemMutation.mutate(variantId);
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
            <div className="min-h-screen bg-[#fbf9f3]">
                <div className="max-w-[1280px] mx-auto px-10 py-8 min-h-[716px] flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] p-12 text-center max-w-lg w-full">
                        <span className="material-symbols-outlined text-6xl text-[#c1c8c2] mb-4 block">lock</span>
                        <h2 className="font-semibold text-2xl text-[#012d1d] mb-2">Vui lòng đăng nhập</h2>
                        <p className="text-sm text-[#414844] mb-8">
                            Bạn cần đăng nhập để xem giỏ hàng và thực hiện mua hàng.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login?redirect=/cart"
                                className="bg-[#1b4332] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#012d1d] transition-all"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="border border-[#c1c8c2] text-[#414844] px-8 py-3 rounded-xl font-semibold hover:bg-[#f0eee8] transition-all"
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
            <div className="min-h-screen bg-[#fbf9f3]">
                <div className="max-w-[1280px] mx-auto px-10 py-8">
                    <h1 className="text-2xl font-bold text-[#012d1d]">Giỏ hàng của bạn</h1>
                    <div className="grid grid-cols-[1fr_380px] gap-8 mt-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b border-[#e4e2dd] last:border-0 animate-pulse">
                                    <div className="w-20 h-20 rounded-xl bg-[#f0eee8] flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-[#f0eee8] rounded w-3/4" />
                                        <div className="h-4 bg-[#f0eee8] rounded w-1/2" />
                                        <div className="h-4 bg-[#f0eee8] rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                            <div className="h-6 bg-[#f0eee8] rounded w-1/2 mb-4" />
                            <div className="space-y-3">
                                <div className="h-4 bg-[#f0eee8] rounded w-full" />
                                <div className="h-4 bg-[#f0eee8] rounded w-full" />
                                <div className="h-4 bg-[#f0eee8] rounded w-full" />
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
            <div className="min-h-screen bg-[#fbf9f3]">
                <div className="max-w-[1280px] mx-auto px-10 py-8">
                    <h1 className="text-2xl font-bold text-[#012d1d]">Giỏ hàng của bạn</h1>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center mt-6">
                        <span className="material-symbols-outlined text-5xl text-[#ba1a1a] mb-4 block">cloud_off</span>
                        <p className="text-lg text-[#ba1a1a] mb-6">Không thể tải giỏ hàng. Vui lòng thử lại.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 bg-[#1b4332] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#012d1d] transition-all"
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
            <div className="min-h-screen bg-[#fbf9f3]">
                <div className="max-w-[1280px] mx-auto px-10 py-8">
                    <h1 className="text-2xl font-bold text-[#012d1d]">Giỏ hàng của bạn</h1>
                    <div className="bg-white rounded-2xl shadow-sm py-20 text-center mt-6">
                        <span className="material-symbols-outlined text-6xl text-[#c1c8c2] mb-4 block">shopping_cart</span>
                        <p className="text-xl font-semibold text-[#012d1d] mb-2">Giỏ hàng trống</p>
                        <p className="text-sm text-[#414844] mb-8">Giỏ hàng chưa có mặt hàng nào</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-[#1b4332] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#012d1d] transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Tiếp tục mua hàng
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Cart with items ─────────────────────────────── */
    const subtotal = items.reduce(
        (sum: number, item: any) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
        0,
    );

    return (
        <div className="min-h-screen bg-[#fbf9f3]">
            <div className="max-w-[1280px] mx-auto px-10 py-8">
                <h1 className="text-2xl font-bold text-[#012d1d]">Giỏ hàng của bạn</h1>
                <div className="grid grid-cols-[1fr_380px] gap-8 mt-6 items-start">
                    {/* ── Left: Cart Items ── */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            {items.map((item: any, idx: number) => (
                                <div
                                    key={item.id ?? item.productVariantId ?? idx}
                                    className="flex items-center gap-4 py-4 border-b border-[#e4e2dd] last:border-0"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-xl bg-[#f0eee8] flex-shrink-0 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.thumbnailUrl || item.product?.product?.images?.[0] || '/placeholder.png'}
                                            className="w-full h-full object-cover"
                                            alt={item.productNameSnapshot ?? 'Sản phẩm'}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#1b1c18] text-base leading-tight truncate">
                                            {item.productNameSnapshot ?? item.skuSnapshot ?? 'Sản phẩm'}
                                        </p>
                                        <p className="text-sm text-[#414844] mt-0.5 truncate">
                                            {item.variantName ?? item.skuSnapshot}
                                        </p>
                                        <p className="text-[#1b4332] font-semibold mt-1">
                                            {Number(item.priceSnapshot ?? item.unitPrice ?? 0).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>

                                    {/* Quantity */}
                                    <div className="flex items-center border border-[#c1c8c2] rounded-lg overflow-hidden flex-shrink-0">
                                        <button
                                            onClick={() => updateQuantity(item.productVariantId, item.qty - 1)}
                                            className="w-9 h-9 flex items-center justify-center text-[#1b4332] hover:bg-[#f0eee8] font-bold transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-10 text-center text-sm font-medium text-[#1b1c18]">{item.qty}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productVariantId, item.qty + 1)}
                                            className="w-9 h-9 flex items-center justify-center text-[#1b4332] hover:bg-[#f0eee8] font-bold transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Total + Delete */}
                                    <div className="text-right flex-shrink-0 min-w-[100px]">
                                        <p className="font-bold text-[#1b4332] text-base">
                                            {(Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty).toLocaleString('vi-VN')}đ
                                        </p>
                                        <button
                                            onClick={() => removeItem(item.productVariantId)}
                                            className="mt-1 text-[#ba1a1a] hover:text-red-700 text-sm flex items-center gap-1 ml-auto transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Continue shopping */}
                        <a href="/products" className="inline-flex items-center gap-1 mt-4 text-[#1b4332] hover:underline text-sm transition-colors">
                            ← Tiếp tục mua sắm
                        </a>
                    </div>

                    {/* ── Right: Order Summary ── */}
                    <div className="sticky top-4">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="font-semibold text-[#1b1c18] text-lg mb-4">Tóm tắt đơn hàng</h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#414844]">Tạm tính</span>
                                    <span className="font-medium text-[#1b1c18]">{subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>

                                {/* Discount code */}
                                <div className="flex gap-2 py-2">
                                    <input
                                        placeholder="Nhập mã giảm giá..."
                                        className="flex-1 border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b4332] transition-colors text-[#1b1c18] placeholder:text-[#414844]"
                                    />
                                    <button className="bg-[#1b4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#012d1d] transition-colors whitespace-nowrap">
                                        Áp dụng
                                    </button>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-[#414844]">Phí vận chuyển</span>
                                    <span className="text-[#10B981] font-medium">Miễn phí</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-[#e4e2dd] mt-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-[#1b1c18]">Tổng cộng</span>
                                    <span className="font-bold text-[#1b4332] text-2xl">
                                        {subtotal.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            </div>

                            {/* Checkout button */}
                            <button
                                onClick={handleCheckout}
                                className="w-full mt-4 bg-[#ffc641] hover:bg-[#f6be39] text-[#261a00] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-xl">payment</span>
                                Tiến hành thanh toán
                            </button>

                            {/* Trust */}
                            <p className="text-center text-xs text-[#414844] mt-3 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Thanh toán bảo mật chuẩn SSL 256-bit
                            </p>

                            {/* Payment logos */}
                            <div className="flex justify-center gap-3 mt-3">
                                {['VNPAY', 'MOMO', 'COD'].map((m) => (
                                    <span key={m} className="text-xs border border-[#c1c8c2] rounded px-2 py-1 text-[#414844]">
                                        {m}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
