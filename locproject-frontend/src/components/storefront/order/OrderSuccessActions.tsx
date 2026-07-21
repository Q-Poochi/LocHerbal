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
        <div className="w-full flex flex-col md:flex-row gap-4">
            <Link
                href={`/orders/${orderId}`}
                className="flex-1 bg-primary text-on-primary py-4 rounded-lg font-label-bold text-label-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                Theo dõi đơn hàng
            </Link>
            <Link
                href="/products"
                className="flex-1 bg-transparent border border-primary text-primary py-4 rounded-lg font-label-bold text-label-bold hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                Tiếp tục mua sắm
            </Link>
        </div>
    );
}