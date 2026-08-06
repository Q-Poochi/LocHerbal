'use client';

import { resolveCartItemImage } from '../../../lib/utils/imageUrl';

interface OrderItem {
    id: string;
    productNameSnapshot?: string;
    productName?: string;
    qty: number;
    priceSnapshot?: number;
    unitPrice?: number;
    price?: number;
    thumbnailUrl?: string;
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
        <div className="bg-white rounded-3xl shadow-card border border-border p-6 space-y-5">
            <h3 className="font-display font-bold text-text-primary text-lg">Tóm tắt đơn hàng</h3>

            {/* Product List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => {
                    const itemPrice = Number(item.priceSnapshot ?? item.unitPrice ?? item.price ?? 0);
                    const imgSrc = resolveCartItemImage(item) || '/placeholder.png';
                    return (
                        <div key={item.id} className="flex gap-3 items-center">
                            <div className="w-14 h-14 bg-primary-50 rounded-xl overflow-hidden flex-shrink-0 border border-primary-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    className="w-full h-full object-cover"
                                    src={imgSrc}
                                    alt={item.productNameSnapshot ?? item.productName ?? 'Sản phẩm'}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text-primary text-sm leading-tight line-clamp-2">
                                    {item.productNameSnapshot ?? item.productName ?? 'Sản phẩm'}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5">SL: {item.qty}</p>
                            </div>
                            <p className="text-primary-700 font-bold text-sm flex-shrink-0">
                                {(itemPrice * (item.qty ?? 1)).toLocaleString('vi-VN')}đ
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Discount Code */}
            <div className="flex gap-2">
                <input
                    className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 transition-all text-text-primary placeholder:text-text-tertiary bg-surface-bg"
                    placeholder="Nhập mã giảm giá..."
                    type="text"
                />
                <button className="bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition-colors whitespace-nowrap">
                    Áp dụng
                </button>
            </div>

            {/* Price Details */}
            <div className="space-y-3 pt-4 border-t border-border text-sm">
                <div className="flex justify-between">
                    <span className="text-text-secondary">Tạm tính ({items.length} SP)</span>
                    <span className="font-semibold text-text-primary">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Phí vận chuyển</span>
                    <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'text-text-primary'}>
                        {shipping === 0 ? 'Miễn phí' : `${Number(shipping).toLocaleString('vi-VN')}đ`}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-secondary">Giảm giá</span>
                    <span className="text-green-600 font-semibold">- 0đ</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border">
                    <span className="font-display font-bold text-text-primary text-base">Tổng cộng</span>
                    <span className="font-display font-bold text-primary-700 text-xl">
                        {Number(total).toLocaleString('vi-VN')}đ
                    </span>
                </div>
            </div>

            <p className="text-center text-xs text-text-tertiary flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm text-green-600">verified_user</span>
                Giá đã bao gồm thuế GTGT
            </p>
        </div>
    );
}
