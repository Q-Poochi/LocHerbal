import OrderSuccessActions from '@/components/storefront/order/OrderSuccessActions';

interface OrderSuccessPageProps {
    searchParams: Promise<{ orderId?: string; orderCode?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
    const params = await searchParams;
    const orderId = params.orderId || '';
    const orderCode = params.orderCode || '';

    return (
        <main className="flex-grow flex items-center justify-center py-16 px-4 bg-surface-bg min-h-[80vh]">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-card border border-border p-8 md:p-12 flex flex-col items-center">
                {/* Success Animation Section */}
                <div className="mb-8 relative">
                    <svg className="w-24 h-24 md:w-32 md:h-32" viewBox="0 0 100 100">
                        {/* Circle */}
                        <circle
                            className="animate-circle"
                            cx="50"
                            cy="50"
                            fill="none"
                            r="45"
                            stroke="#10B981"
                            strokeWidth="5"
                        />
                        {/* Checkmark */}
                        <path
                            className="animate-check"
                            d="M30 52 L45 65 L72 35"
                            fill="none"
                            stroke="#10B981"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="6"
                        />
                    </svg>
                </div>

                {/* Title & Order Info */}
                <div className="text-center mb-8 space-y-3">
                    <h1 data-testid="order-confirmation-heading" className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                        Đặt hàng thành công! 🎉
                    </h1>
                    <p className="text-text-secondary text-sm md:text-base max-w-sm mx-auto">
                        Cảm ơn bạn đã tin tưởng lựa chọn thảo dược chất lượng cao từ Lộc Herbal.
                    </p>
                    {orderCode && (
                        <div className="mt-4 inline-block bg-primary-50 border border-primary-100 px-5 py-2.5 rounded-2xl">
                            <span className="text-text-secondary text-xs font-semibold">
                                Mã đơn hàng:
                            </span>
                            <span className="text-primary-700 font-bold ml-1.5 font-display text-sm">#{orderCode}</span>
                        </div>
                    )}
                    <p className="text-xs text-text-tertiary italic mt-2">
                        Chúng tôi đã gửi email xác nhận chi tiết đến địa chỉ của bạn.
                    </p>
                </div>

                {/* Actions */}
                <OrderSuccessActions orderId={orderId || orderCode} />

                {/* Trust Badge */}
                <div className="mt-8 flex items-center gap-1.5 text-text-tertiary">
                    <span
                        className="material-symbols-outlined text-[16px] text-green-600"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        verified_user
                    </span>
                    <span className="text-xs">
                        Thanh toán bảo mật chuẩn SSL 256-bit
                    </span>
                </div>
            </div>
        </main>
    );
}