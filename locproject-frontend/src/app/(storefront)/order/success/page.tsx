import OrderSuccessActions from '@/components/storefront/order/OrderSuccessActions';
import OrderCodeFetcher from '@/components/storefront/order/OrderCodeFetcher';

interface OrderSuccessPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function first(v: string | string[] | undefined): string {
    return Array.isArray(v) ? v[0] ?? '' : (v ?? '');
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
    const params = await searchParams;

    const orderId = first(params.orderId);
    const orderCode = first(params.orderCode);

    // VNPay return: VNPay redirects về đây với dãy tham số vnp_*.
    // Xác thực chữ ký qua backend rồi lấy orderId từ vnp_TxnRef.
    let vnpayError = '';
    let resolvedOrderId = orderId;
    let resolvedOrderCode = orderCode;

    if (!orderId && params.vnp_TxnRef) {
        const vnpParams = Object.fromEntries(
            Object.entries(params).filter(([k]) => k.startsWith('vnp_') && k !== 'vnp_SecureHashType'),
        );
        const qs = new URLSearchParams(
            Object.entries(vnpParams).map(([k, v]) => [k, first(v)]),
        ).toString();

        try {
            const res = await fetch(`${API_URL}/payment/vnpay-return?${qs}`, { cache: 'no-store' });
            const data = await res.json();
            if (data?.success) {
                resolvedOrderId = data.orderId || first(params.vnp_TxnRef);
            } else {
                vnpayError = data?.message || 'Giao dịch thất bại hoặc bị hủy';
            }
        } catch {
            vnpayError = 'Không thể xác thực giao dịch, vui lòng liên hệ hỗ trợ';
        }
    }

    return (
        <main className="flex-grow flex items-center justify-center py-16 px-4 bg-surface-bg min-h-[80vh]">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-card border border-border p-8 md:p-12 flex flex-col items-center">
                {/* Success Animation Section */}
                <div className="mb-8 relative">
                    <svg className="w-24 h-24 md:w-32 md:h-32" viewBox="0 0 100 100">
                        <circle
                            className="animate-circle"
                            cx="50"
                            cy="50"
                            fill="none"
                            r="45"
                            stroke="#10B981"
                            strokeWidth="5"
                        />
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

                {vnpayError ? (
                    <>
                        <div className="text-center mb-8 space-y-3">
                            <h1 data-testid="order-confirmation-heading" className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                                Thanh toán chưa hoàn tất
                            </h1>
                            <p className="text-text-secondary text-sm md:text-base max-w-sm mx-auto">
                                {vnpayError}
                            </p>
                        </div>
                        <OrderSuccessActions orderId={resolvedOrderId} failed />
                    </>
                ) : (
                    <>
                        {/* Title & Order Info */}
                        <div className="text-center mb-8 space-y-3">
                            <h1 data-testid="order-confirmation-heading" className="font-display font-bold text-2xl md:text-3xl text-text-primary">
                                Đặt hàng thành công!
                            </h1>
                            <p className="text-text-secondary text-sm md:text-base max-w-sm mx-auto">
                                Cảm ơn bạn đã tin tưởng lựa chọn thảo dược chất lượng cao từ Lộc Herbal.
                            </p>
                            {resolvedOrderCode && (
                                <div className="mt-4 inline-block bg-primary-50 border border-primary-100 px-5 py-2.5 rounded-2xl">
                                    <span className="text-text-secondary text-xs font-semibold">
                                        Mã đơn hàng:
                                    </span>
                                    <span className="text-primary-700 font-bold ml-1.5 font-display text-sm">#{resolvedOrderCode}</span>
                                </div>
                            )}
                            {!resolvedOrderCode && resolvedOrderId && (
                                <OrderCodeFetcher orderId={resolvedOrderId} />
                            )}
                            <p className="text-xs text-text-tertiary italic mt-2">
                                Chúng tôi đã gửi email xác nhận chi tiết đến địa chỉ của bạn.
                            </p>
                        </div>

                        {/* Actions */}
                        <OrderSuccessActions orderId={resolvedOrderId || resolvedOrderCode} />

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
                    </>
                )}
            </div>
        </main>
    );
}