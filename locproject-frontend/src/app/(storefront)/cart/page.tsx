'use client';

import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/lib/hooks/useProducts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartItem from '@/components/storefront/cart/CartItem';
import { useAuthStore } from '@/lib/store/auth.store';
import { useToast } from '@/lib/providers/toast-provider';

export default function CartPage() {
    const { data: cart, isLoading, error } = useCart();
    console.log('Cart data:', JSON.stringify(cart, null, 2));
    const updateQuantityMutation = useUpdateCartItem();
    const removeItemMutation = useRemoveFromCart();
    const router = useRouter();
    const { user } = useAuthStore();
    const toast = useToast();

    const updateQuantity = (variantId: string, qty: number) => {
        updateQuantityMutation.mutate({ variantId, qty });
    };

    const removeItem = (variantId: string) => {
        removeItemMutation.mutate(variantId);
    };

    const handleCheckoutClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            toast.error('Vui lòng đăng nhập để thanh toán');
            router.push('/login?redirect=/checkout');
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">
                    Giỏ hàng của bạn
                </h1>
                <div className="flex flex-col lg:flex-row gap-gutter">
                    <div className="w-full lg:w-[65%] space-y-stack-md">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="bg-surface-white p-4 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] flex flex-col sm:flex-row items-center gap-4 border border-outline-variant/30 animate-pulse"
                            >
                                <div className="w-24 h-24 bg-surface-container rounded-lg" />
                                <div className="flex-grow space-y-2">
                                    <div className="h-5 bg-surface-container rounded w-3/4" />
                                    <div className="h-4 bg-surface-container rounded w-1/2" />
                                    <div className="h-4 bg-surface-container rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">
                    Giỏ hàng của bạn
                </h1>
                <div className="bg-error-container/10 border border-error-container/30 rounded-lg p-6 text-center">
                    <p className="text-error font-body-md">Không thể tải giỏ hàng. Vui lòng thử lại.</p>
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
                <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">
                    Giỏ hàng của bạn
                </h1>
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
            </div>
        );
    }

    const subtotal = cart.items.reduce(
        (sum: number, item: any) => sum + Number(item.priceSnapshot ?? item.unitPrice ?? 0) * item.qty,
        0
    );
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    // Log raw values for debugging
    console.log('Raw unitPrice values:', cart.items?.map((item: any) => ({ id: item.id, unitPrice: item.unitPrice, qty: item.qty })));

    return (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg min-h-[716px]">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">
                Giỏ hàng của bạn
            </h1>
            <div className="flex flex-col lg:flex-row gap-gutter">
                {/* Left Column: Product List (65%) */}
                <section className="w-full lg:w-[65%] space-y-stack-md">
                    {cart.items.map((item: any) => {
                        console.log('Cart item:', item);
                        return (
                            <CartItem
                                key={item.id}
                                id={item.id}
                                name={item.productNameSnapshot}
                                variant={item.skuSnapshot}
                                price={Number(item.priceSnapshot ?? item.unitPrice ?? 0)}
                                quantity={item.qty}
                                thumbnail={item.product?.product?.images?.[0] || '/placeholder.png'}
                                inStock={true}
                                onQuantityChange={(qty) => updateQuantity(item.productVariantId, qty)}
                                onRemove={() => removeItem(item.productVariantId)}
                            />
                        );
                    })}

                    <div className="pt-stack-md">
                        <Link
                            href="/products"
                            className="inline-flex items-center text-primary font-label-bold hover:text-secondary transition-colors"
                        >
                            <span className="material-symbols-outlined mr-2">arrow_back</span>
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </section>

                {/* Right Column: Order Summary (35%) */}
                <aside className="w-full lg:w-[35%]">
                    <div className="bg-surface-white p-6 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant/30 sticky top-24">
                        <h2 className="font-headline-md text-headline-md text-primary mb-6">
                            Tóm tắt đơn hàng
                        </h2>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-body-md">
                                <span className="text-on-surface-variant">Tạm tính</span>
                                <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-body-sm font-medium">Mã giảm giá</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-grow border border-outline-variant rounded-lg px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="Nhập mã..."
                                        type="text"
                                    />
                                    <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-bold hover:bg-primary-container transition-colors">
                                        Áp dụng
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between text-body-md">
                                <span className="text-on-surface-variant">Phí vận chuyển</span>
                                <span className="text-success-leaf font-bold">Miễn phí</span>
                            </div>
                        </div>
                        <hr className="border-outline-variant/30 mb-6" />
                        <div className="flex justify-between items-end mb-8">
                            <span className="font-headline-md text-headline-md text-primary">Tổng cộng</span>
                            <span className="font-display-lg text-[28px] text-primary font-bold">
                                {(isNaN(total) ? 0 : total).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={handleCheckoutClick}
                            className="w-full bg-primary text-on-primary py-4 rounded-lg font-headline-md text-headline-md hover:bg-primary-container transition-all active:scale-[0.98] mb-6 flex items-center justify-center gap-2"
                        >
                            Tiến hành thanh toán
                            <span className="material-symbols-outlined">payments</span>
                        </Link>
                        {/* Payment Partners */}
                        <div className="space-y-4">
                            <p className="text-[11px] text-center text-outline uppercase tracking-wider font-bold">
                                Phương thức thanh toán hỗ trợ
                            </p>
                            <div className="flex justify-center gap-4 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                                <div className="w-10 h-6 bg-surface-container rounded flex items-center justify-center font-bold text-[10px]">
                                    VNPAY
                                </div>
                                <div className="w-10 h-6 bg-surface-container rounded flex items-center justify-center font-bold text-[10px]">
                                    MOMO
                                </div>
                                <div className="w-10 h-6 bg-surface-container rounded flex items-center justify-center font-bold text-[10px]">
                                    COD
                                </div>
                            </div>
                        </div>
                        {/* Security Badge */}
                        <div className="mt-8 pt-6 border-t border-outline-variant/20 flex items-center justify-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                            <span className="text-body-sm">Thanh toán bảo mật chuẩn SSL 256-bit</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}