'use client';

interface OrderItem {
    id: string;
    productNameSnapshot?: string;
    productName?: string;
    qty: number;
    priceSnapshot?: number;
    unitPrice?: number;
    price?: number;
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-[#1b1c18] text-lg mb-4">Tóm tắt đơn hàng</h3>

            {/* Product List */}
            <div className="space-y-4">
                {items.map((item) => {
                    const itemPrice = Number(item.priceSnapshot ?? item.unitPrice ?? item.price ?? 0);
                    return (
                        <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-[#f0eee8] rounded-lg overflow-hidden flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    className="w-full h-full object-cover"
                                    src={item.thumbnail || item.product?.product?.images?.[0] || '/placeholder.png'}
                                    alt={item.productNameSnapshot ?? item.productName ?? 'Sản phẩm'}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1b1c18] text-sm leading-tight truncate">
                                    {item.productNameSnapshot ?? item.productName ?? 'Sản phẩm'}
                                </p>
                                <p className="text-xs text-[#414844] mt-0.5">Số lượng: {item.qty}</p>
                                <p className="text-[#1b4332] font-semibold text-sm mt-1">
                                    {(itemPrice * (item.qty ?? 1)).toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Discount Code */}
            <div className="flex gap-2 mt-6">
                <input
                    className="flex-1 border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1b4332] transition-colors text-[#1b1c18] placeholder:text-[#414844]"
                    placeholder="Nhập mã giảm giá..."
                    type="text"
                />
                <button className="bg-[#1b4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#012d1d] transition-colors whitespace-nowrap">
                    Áp dụng
                </button>
            </div>

            {/* Price Details */}
            <div className="space-y-3 pt-6 border-t border-[#e4e2dd] mt-6">
                <div className="flex justify-between text-sm">
                    <span className="text-[#414844]">Tạm tính</span>
                    <span className="font-medium text-[#1b1c18]">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[#414844]">Phí vận chuyển</span>
                    <span className={shipping === 0 ? 'text-[#10B981] font-medium' : 'text-[#1b1c18]'}>
                        {shipping === 0 ? 'Miễn phí' : `${Number(shipping).toLocaleString('vi-VN')}đ`}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[#414844]">Giảm giá</span>
                    <span className="text-[#10B981]">- 0đ</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-[#e4e2dd]">
                    <span className="font-semibold text-[#1b1c18]">Tổng cộng</span>
                    <span className="font-bold text-[#1b4332] text-xl">
                        {Number(total).toLocaleString('vi-VN')}đ
                    </span>
                </div>
            </div>

            <p className="text-center text-xs text-[#414844] mt-4 italic">
                * Giá đã bao gồm thuế GTGT
            </p>
        </div>
    );
}
