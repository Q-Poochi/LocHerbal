import CheckoutClient from './CheckoutClient';
import OrderSummary from '@/components/storefront/checkout/OrderSummary';

export default function CheckoutPage() {
    return (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
            {/* Page Header & Step Indicator */}
            <header className="mb-stack-lg">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-8 text-center">
                    Thanh toán đơn hàng
                </h1>
                <div className="flex items-center justify-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center flex-1 relative">
                        <div
                            className="step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center bg-primary text-white border-primary"
                        >
                            <span className="font-bold">1</span>
                        </div>
                        <span className="mt-2 font-label-bold text-label-bold text-primary">Thông tin</span>
                        <div className="absolute top-5 left-[60%] right-[-40%] h-[2px] bg-outline-variant" />
                    </div>
                    <div className="flex flex-col items-center flex-1 relative">
                        <div
                            className="step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center bg-surface-white border-outline-variant text-outline"
                        >
                            <span className="font-bold">2</span>
                        </div>
                        <span className="mt-2 font-label-bold text-label-bold text-outline">Thanh toán</span>
                        <div className="absolute top-5 left-[60%] right-[-40%] h-[2px] bg-outline-variant" />
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <div
                            className="step-circle w-10 h-10 rounded-full border-2 flex items-center justify-center bg-surface-white border-outline-variant text-outline"
                        >
                            <span className="font-bold">3</span>
                        </div>
                        <span className="mt-2 font-label-bold text-label-bold text-outline">Xác nhận</span>
                    </div>
                </div>
            </header>

            <CheckoutClient />
        </div>
    );
}