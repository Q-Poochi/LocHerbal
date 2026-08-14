'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, useCheckout } from '@/lib/hooks/useProducts';
import { useAuthStore } from '@/lib/store/auth.store';
import { useToast } from '@/lib/providers/toast-provider';
import CheckoutForm, { CheckoutFormData } from '@/components/storefront/checkout/CheckoutForm';
import OrderSummary from '@/components/storefront/checkout/OrderSummary';
import { getErrorMessage } from '@/lib/utils/error';
import type { CartItem } from '@/types/api.types';

export default function CheckoutClient() {
    const { data: cart, isLoading: cartLoading } = useCart();
    const checkoutMutation = useCheckout();
    const toast = useToast();
    const user = useAuthStore((s) => s.user);
    const [completed, setCompleted] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    const handleCheckout = async (data: CheckoutFormData) => {
        console.log('[Checkout] form data:', data);
        try {
            const result = await checkoutMutation.mutateAsync({
                ...data,
                couponCode: couponCode || undefined,
            });
            if (result?.paymentUrl) {
                // VNPay: redirect sang URL thanh toán
                window.location.href = result.paymentUrl;
                return;
            }
            // COD hoặc không có url: coi như đặt hàng thành công
            setCompleted(true);
            toast.success('Đặt hàng thành công!');
        } catch (error) {
            console.error('[Checkout] failed:', error);
            toast.error(getErrorMessage(error, 'Đặt hàng thất bại, vui lòng thử lại'));
        }
    };

    if (cartLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <div className="animate-pulse h-96 bg-primary-50 rounded-3xl border border-border" />
                </div>
                <div className="lg:col-span-4">
                    <div className="animate-pulse h-64 bg-primary-50 rounded-3xl border border-border" />
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-5xl text-primary-300"
                        style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                </div>
                <p className="font-display font-bold text-xl text-text-primary mb-2">Giỏ hàng trống</p>
                <p className="text-sm text-text-secondary mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-800 transition-all text-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    const subtotal = cart.items.reduce(
        (sum: number, item: CartItem) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
        0,
    );
    const shippingFee = 0;

    if (completed) {
        return (
            <div className="bg-white p-12 rounded-3xl shadow-card border border-border text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-primary-700 text-5xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h2 data-testid="order-confirmation-heading" className="font-display font-bold text-3xl text-text-primary mb-2">Đặt hàng thành công!</h2>
                <p className="text-text-secondary mb-2 max-w-md mx-auto">
                    Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
                </p>
                <p className="text-sm text-text-tertiary max-w-md mx-auto mb-8">
                    Chúng tôi sẽ gửi email xác nhận chi tiết đến địa chỉ của bạn.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href="/orders"
                        className="px-6 py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-all"
                    >
                        Xem đơn hàng
                    </Link>
                    <Link
                        href="/products"
                        className="px-6 py-3 border border-border text-text-secondary rounded-xl font-semibold hover:bg-surface-bg transition-all"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <CheckoutForm
                defaultValues={{ fullName: user?.fullName || '', email: user?.email || '' }}
                isPending={checkoutMutation.isPending}
                onSubmit={handleCheckout}
            />

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
                <OrderSummary
                    items={cart.items}
                    subtotal={subtotal}
                    shippingFee={shippingFee}
                    onCouponChange={setCouponCode}
                />
            </div>
        </div>
    );
}