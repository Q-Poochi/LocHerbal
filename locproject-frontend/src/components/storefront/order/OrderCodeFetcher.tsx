'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface OrderCodeFetcherProps {
    orderId: string;
}

export default function OrderCodeFetcher({ orderId }: OrderCodeFetcherProps) {
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await apiClient.get(`/orders/${orderId}`);
                if (!cancelled && data?.orderCode) setCode(data.orderCode);
            } catch {
                // Không hiện lỗi trên trang thành công — chỉ bỏ qua mã đơn
            }
        })();
        return () => { cancelled = true; };
    }, [orderId]);

    if (!code) return null;

    return (
        <div className="mt-4 inline-block bg-primary-50 border border-primary-100 px-5 py-2.5 rounded-2xl">
            <span className="text-text-secondary text-xs font-semibold">
                Mã đơn hàng:
            </span>
            <span className="text-primary-700 font-bold ml-1.5 font-display text-sm">#{code}</span>
        </div>
    );
}