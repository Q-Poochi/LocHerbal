'use client';

interface OrderItem {
    id: string;
    productNameSnapshot: string;
    qty: number;
    unitPrice: number;
    product?: { product?: { images?: string[] } };
    thumbnail?: string;
}

interface OrderSummaryProps {
    items: OrderItem[];
    subtotal: number;
    shippingFee?: number;
}

export default function OrderSummary({ items, subtotal, shippingFee = 0 }: OrderSummaryProps) {
    const shipping = subtotal >= 500000 ? 0 : shippingFee;
    const total = subtotal + shipping;

    return (
        <div className="bg-surface-white p-6 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-primary mb-6">Tóm tắt đơn hàng</h3>

            {/* Product List */}
            <div className="space-y-4 mb-6">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                className="w-full h-full object-cover"
                                src={item.thumbnail || item.product?.product?.images?.[0] || '/placeholder.png'}
                                alt={item.productNameSnapshot}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="font-label-bold text-primary line-clamp-1">{item.productNameSnapshot}</p>
                            <p className="text-body-sm text-on-surface-variant">Số lượng: {item.qty}</p>
                            <p className="font-body-md text-primary mt-1">
                                {(Number(item.unitPrice) * item.qty).toLocaleString('vi-VN')}đ
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Details */}
            <div className="space-y-3 pt-6 border-t border-outline-variant">
                <div className="flex justify-between font-body-md text-on-surface-variant">
                    <span>Tạm tính</span>
                    <span>{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between font-body-md text-on-surface-variant">
                    <span>Phí vận chuyển</span>
                    <span className={shipping === 0 ? 'text-success-leaf font-bold' : ''}>
                        {shipping === 0 ? 'Miễn phí' : `${Number(shipping).toLocaleString('vi-VN')}đ`}
                    </span>
                </div>
                <div className="flex justify-between font-body-md text-on-surface-variant">
                    <span>Giảm giá</span>
                    <span className="text-success-leaf">- 0đ</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-outline-variant">
                    <span className="font-headline-md text-headline-md text-primary">Tổng cộng</span>
                    <span className="font-headline-md text-headline-md text-accent">
                        {Number(total).toLocaleString('vi-VN')}đ
                    </span>
                </div>
            </div>

            <p className="text-center text-body-sm text-on-surface-variant mt-6 italic">
                * Giá đã bao gồm thuế GTGT
            </p>
        </div>
    );
}