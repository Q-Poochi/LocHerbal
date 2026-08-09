'use client';

import { useParams, useRouter } from 'next/navigation';
import CouponForm from '@/components/admin/coupons/CouponForm';
import { useAdminCoupons } from '@/lib/hooks/useMarketing';
import { getErrorMessage } from '@/lib/utils/error';

export default function EditCouponPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { data: coupons = [], isLoading, error } = useAdminCoupons();

    const coupon = coupons.find((c) => c.id === params.id);

    if (isLoading) {
        return <p className="text-on-surface-variant">Đang tải...</p>;
    }

    if (error) {
        return <p className="text-error">{getErrorMessage(error, 'Không thể tải mã giảm giá')}</p>;
    }

    if (!coupon) {
        return (
            <div className="text-center py-20">
                <p className="text-on-surface-variant mb-4">Không tìm thấy mã giảm giá.</p>
                <button onClick={() => router.push('/admin/coupons')} className="text-primary font-semibold">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return <CouponForm coupon={coupon} />;
}