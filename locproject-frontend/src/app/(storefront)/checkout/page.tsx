import CheckoutClient from './CheckoutClient';

export const metadata = {
    title: 'Thanh toán | Lộc Herbal',
};

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-surface-bg">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">

                {/* Page Header */}
                <div className="text-center mb-10">
                    <h1 className="font-display font-bold text-3xl text-text-primary mb-2">Thanh toán đơn hàng</h1>
                    <p className="text-sm text-text-secondary">Hoàn thành thông tin để đặt hàng</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center max-w-xs mx-auto mb-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            1
                        </div>
                        <span className="mt-1.5 text-xs font-semibold text-primary-700">Thông tin</span>
                    </div>
                    {/* Connector */}
                    <div className="flex-1 h-0.5 bg-border mx-3 mb-4" />
                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-border bg-white text-text-tertiary flex items-center justify-center font-bold text-sm">
                            2
                        </div>
                        <span className="mt-1.5 text-xs font-semibold text-text-tertiary">Thanh toán</span>
                    </div>
                    {/* Connector */}
                    <div className="flex-1 h-0.5 bg-border mx-3 mb-4" />
                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-border bg-white text-text-tertiary flex items-center justify-center font-bold text-sm">
                            3
                        </div>
                        <span className="mt-1.5 text-xs font-semibold text-text-tertiary">Xác nhận</span>
                    </div>
                </div>

                <CheckoutClient />
            </div>
        </div>
    );
}