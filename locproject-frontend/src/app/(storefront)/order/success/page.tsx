import OrderSuccessActions from '@/components/storefront/order/OrderSuccessActions';

interface OrderSuccessPageProps {
    searchParams: Promise<{ orderId?: string; orderCode?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
    const params = await searchParams;
    const orderId = params.orderId || '';
    const orderCode = params.orderCode || '';

    return (
        <main className="flex-grow flex items-center justify-center py-stack-lg px-margin-mobile">
            <div className="max-w-2xl w-full flex flex-col items-center">
                {/* Success Animation Section */}
                <div className="mb-stack-lg relative">
                    <svg className="w-32 h-32 md:w-40 md:h-40" viewBox="0 0 100 100">
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
                <div className="text-center mb-stack-lg space-y-2">
                    <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
                        Đặt hàng thành công! 🎉
                    </h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">
                        Cảm ơn bạn đã tin tưởng lựa chọn thảo dược từ Thảo Mộc Việt.
                    </p>
                    {orderCode && (
                        <div className="mt-4 inline-block bg-surface-container px-4 py-2 rounded-lg">
                            <span className="text-on-surface-variant font-label-bold text-label-bold">
                                Mã đơn hàng:
                            </span>
                            <span className="text-primary font-bold ml-1">#{orderCode}</span>
                        </div>
                    )}
                    <p className="text-caption text-on-surface-variant italic mt-2">
                        Chúng tôi đã gửi email xác nhận chi tiết đến địa chỉ của bạn.
                    </p>
                </div>

                {/* Order Summary Card (Minimalist - always render if we have at least orderId) */}
                {orderCode && (
                    <div className="w-full bg-surface-white rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] overflow-hidden border border-outline-variant mb-stack-lg">
                        <div className="p-stack-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                            <h3 className="font-label-bold text-label-bold text-primary">
                                Tóm tắt đơn hàng
                            </h3>
                            <span className="bg-success-leaf/10 text-success-leaf px-2 py-0.5 rounded-full text-caption">
                                Đang xử lý
                            </span>
                        </div>
                        <div className="p-stack-md">
                            <p className="text-center text-on-surface-variant font-body-md py-4">
                                Chi tiết đơn hàng #{orderCode} đã được ghi nhận.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <OrderSuccessActions orderId={orderId || orderCode} />

                {/* Trust Badge */}
                <div className="mt-stack-lg flex items-center gap-2 text-on-surface-variant/60">
                    <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        verified_user
                    </span>
                    <span className="text-caption">
                        Thanh toán bảo mật bởi LocHerbal Trust Network
                    </span>
                </div>
            </div>
        </main>
    );
}