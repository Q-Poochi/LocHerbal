'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart.store';

interface OrderSuccessActionsProps {
    orderId: string;
}

export default function OrderSuccessActions({ orderId }: OrderSuccessActionsProps) {
    // Xóa giỏ hàng khi component mount (người dùng vừa đặt hàng thành công)
    useEffect(() => {
        useCartStore.getState().clearCart();
    }, []);

    return (
        <div className="w-full flex flex-col sm:flex-row gap-3">
            <Link
                href={`/orders/${orderId}`}
                className="flex-1 bg-primary-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Theo dõi đơn hàng
            </Link>
            <Link
                href="/products"
                className="flex-1 bg-white border border-border text-text-secondary py-3.5 rounded-xl font-semibold text-sm hover:bg-surface-bg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                Tiếp tục mua sắm
            </Link>
        </div>
    );
}