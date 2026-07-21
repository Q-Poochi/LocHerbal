'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, useCheckout } from '@/lib/hooks/useProducts';
import { useAuthStore } from '@/lib/store/auth.store';
import { useToast } from '@/lib/providers/toast-provider';
import CheckoutForm, { CheckoutFormData } from '@/components/storefront/checkout/CheckoutForm';
import OrderSummary from '@/components/storefront/checkout/OrderSummary';

export default function CheckoutClient() {
    const { data: cart, isLoading: cartLoading } = useCart();
    const checkoutMutation = useCheckout();
    const toast = useToast();
    const user = useAuthStore((s) => s.user);
    const [completed, setCompleted] = useState(false);

    const handleCheckout = async (data: CheckoutFormData) => {
        console.log('[Checkout] form data:', data);
        try {
            const result = await checkoutMutation.mutateAsync(data);
            if (result?.paymentUrl) {
                // VNPay: redirect sang URL thanh toán
                window.location.href = result.paymentUrl;
                return;
            }
            // COD hoặc không có url: coi như đặt hàng thành công
            setCompleted(true);
            toast.success('Đặt hàng thành công!');
        } catch (error: any) {
            console.error('[Checkout] failed:', error);
            const msg = error?.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại';
            toast.error(msg);
        }
    };

    if (cartLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-8">
                    <div className="animate-pulse h-96 bg-surface-container rounded-lg" />
                </div>
                <div className="lg:col-span-4">
                    <div className="animate-pulse h-64 bg-surface-container rounded-lg" />
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-outline mb-4 block">
                    shopping_cart
                </span>
                <p className="text-body-lg text-on-surface-variant mb-6">
                    Giỏ hàng trống
                </p>
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-label-bold hover:bg-primary-container transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    const subtotal = cart.items.reduce(
        (sum: number, item: any) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
        0,
    );
    const shippingFee = 0;

    if (completed) {
        return (
            <div className="bg-surface-white p-12 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] text-center">
                <div className="w-20 h-20 bg-success-leaf/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-success-leaf text-5xl">check_circle</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Đặt hàng thành công</h2>
                <p className="font-body-md text-on-surface-variant max-w-md mx-auto mb-8">
                    Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng và liên hệ sớm nhất.
                </p>
                <Link
                    href="/products"
                    className="px-6 py-3 border border-primary text-primary rounded-lg font-label-bold hover:bg-surface-container-low transition-colors"
                >
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            <CheckoutForm
                defaultValues={{ fullName: user?.fullName || '', email: user?.email || '' }}
                isPending={checkoutMutation.isPending}
                onSubmit={handleCheckout}
            />

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
                <OrderSummary items={cart.items} subtotal={subtotal} shippingFee={shippingFee} />
            </div>
        </div>
    );
}