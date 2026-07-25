'use client';

import Link from 'next/link';

interface TimelineEvent {
    label: string;
    date: string;
    done: boolean;
}

const statusTimeline: Record<string, TimelineEvent[]> = {
    PENDING: [
        { label: 'Đơn hàng được tạo', date: '24/07/2026 10:30', done: true },
        { label: 'Xác nhận đơn hàng', date: '', done: false },
        { label: 'Đang xử lý', date: '', done: false },
        { label: 'Đang giao hàng', date: '', done: false },
        { label: 'Đã giao hàng', date: '', done: false },
    ],
    CONFIRMED: [
        { label: 'Đơn hàng được tạo', date: '24/07/2026 10:30', done: true },
        { label: 'Xác nhận đơn hàng', date: '24/07/2026 11:00', done: true },
        { label: 'Đang xử lý', date: '', done: false },
        { label: 'Đang giao hàng', date: '', done: false },
        { label: 'Đã giao hàng', date: '', done: false },
    ],
    DELIVERED: [
        { label: 'Đơn hàng được tạo', date: '24/07/2026 10:30', done: true },
        { label: 'Xác nhận đơn hàng', date: '24/07/2026 11:00', done: true },
        { label: 'Đang xử lý', date: '24/07/2026 14:00', done: true },
        { label: 'Đang giao hàng', date: '25/07/2026 09:00', done: true },
        { label: 'Đã giao hàng', date: '26/07/2026 15:30', done: true },
    ],
};

const mockOrder = {
    id: '1',
    code: '#ORD-102',
    customer: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901 234 567',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    status: 'CONFIRMED' as string,
    paymentMethod: 'VNPAY',
    paymentStatus: 'UNPAID',
    createdAt: '24/07/2026 10:30',
    items: [
        { name: 'Cao Gắm Thảo Dược 500g', sku: 'CG-500', qty: 2, price: 450000 },
        { name: 'Trà Dây Túi Lọc 20 túi', sku: 'TD-20', qty: 1, price: 85000 },
    ],
    subtotal: 985000,
    shipping: 0,
    discount: 0,
    total: 985000,
};

const statusBadge: Record<string, string> = {
    PENDING: 'bg-secondary-container text-on-secondary-container',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
};

export default function OrderDetailPage() {
    const timeline = statusTimeline[mockOrder.status] || statusTimeline.PENDING;
    const activeIdx = timeline.filter((e) => e.done).length - 1;

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                        <Link href="/admin/orders" className="hover:text-primary transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            Đơn hàng
                        </Link>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">{mockOrder.code}</span>
                    </nav>
                    <div className="flex items-center gap-3 mt-1">
                        <h2 className="font-headline-lg text-headline-lg text-primary">{mockOrder.code}</h2>
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${statusBadge[mockOrder.status]}`}>
                            {statusLabel[mockOrder.status]}
                        </span>
                    </div>
                </div>
                <Link
                    href="/admin/orders"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all text-body-sm font-bold"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left — Timeline + Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Timeline */}
                    <div className="bg-surface-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                        <div className="flex items-center gap-2 mb-7">
                            <span className="material-symbols-outlined text-primary">timeline</span>
                            <h3 className="font-headline-md text-headline-md text-primary">Trạng thái đơn hàng</h3>
                        </div>
                        <div className="relative pl-1">
                            {timeline.map((event, idx) => (
                                <div key={event.label} className="flex items-start gap-4 pb-7 last:pb-0 relative">
                                    {idx < timeline.length - 1 && (
                                        <div className={`absolute left-[13px] top-8 w-[2px] h-full rounded-full ${event.done ? 'bg-primary/30' : 'bg-outline-variant'}`} />
                                    )}
                                    <div className={`relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${event.done ? 'bg-primary' : 'bg-outline-variant'}`}>
                                        {event.done ? (
                                            <span className="material-symbols-outlined text-[15px] text-white">check</span>
                                        ) : (
                                            <span className="w-2.5 h-2.5 rounded-full bg-outline" />
                                        )}
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className={`font-label-bold text-body-sm ${event.done ? 'text-primary' : 'text-outline'}`}>
                                            {event.label}
                                        </p>
                                        {event.date && (
                                            <p className="text-caption text-on-surface-variant mt-0.5">{event.date}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="bg-surface-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            <h3 className="font-headline-md text-headline-md text-primary">Sản phẩm trong đơn</h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-outline-variant/20">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-container-low text-caption text-on-surface-variant font-bold uppercase">
                                        <th className="px-5 py-3.5 text-left">Sản phẩm</th>
                                        <th className="px-5 py-3.5 text-left">SKU</th>
                                        <th className="px-5 py-3.5 text-center">SL</th>
                                        <th className="px-5 py-3.5 text-right">Đơn giá</th>
                                        <th className="px-5 py-3.5 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {mockOrder.items.map((item) => (
                                        <tr key={item.sku} className="hover:bg-surface-container-lowest/50 transition-colors">
                                            <td className="px-5 py-3.5 text-body-sm text-primary font-label-bold">{item.name}</td>
                                            <td className="px-5 py-3.5 text-caption text-on-surface-variant font-mono">{item.sku}</td>
                                            <td className="px-5 py-3.5 text-center text-body-sm">{item.qty}</td>
                                            <td className="px-5 py-3.5 text-right text-body-sm">{item.price.toLocaleString('vi-VN')}₫</td>
                                            <td className="px-5 py-3.5 text-right text-body-sm font-bold text-primary">{(item.qty * item.price).toLocaleString('vi-VN')}₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right — Customer Info + Actions */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-surface-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="material-symbols-outlined text-primary">person</span>
                            <h3 className="font-headline-md text-headline-md text-primary">Thông tin khách hàng</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Họ tên', value: mockOrder.customer, highlight: true },
                                { label: 'Email', value: mockOrder.email },
                                { label: 'Số điện thoại', value: mockOrder.phone },
                                { label: 'Địa chỉ', value: mockOrder.address, highlight: true },
                            ].map((field) => (
                                <div key={field.label}>
                                    <p className="text-caption text-on-surface-variant mb-0.5">{field.label}</p>
                                    <p className={`text-body-sm ${field.highlight ? 'font-label-bold text-primary' : 'text-on-surface'}`}>{field.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-surface-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            <h3 className="font-headline-md text-headline-md text-primary">Tổng tiền</h3>
                        </div>
                        <div className="space-y-3.5">
                            <Row label="Tạm tính" value={`${mockOrder.subtotal.toLocaleString('vi-VN')}₫`} />
                            <Row label="Phí vận chuyển" value="Miễn phí" valueClass="text-success-leaf font-bold" />
                            <Row label="Giảm giá" value={mockOrder.discount > 0 ? `-${mockOrder.discount.toLocaleString('vi-VN')}₫` : '0₫'} />
                            <hr className="border-outline-variant/50" />
                            <div className="flex justify-between items-center">
                                <span className="font-headline-md text-headline-md text-primary">Tổng cộng</span>
                                <span className="font-headline-md text-headline-md font-bold text-primary">{mockOrder.total.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <hr className="border-outline-variant/50" />
                            <Row
                                label="Thanh toán"
                                value={`${mockOrder.paymentMethod} — ${mockOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}`}
                                valueClass="font-bold"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    {(mockOrder.status === 'PENDING' || mockOrder.status === 'CONFIRMED') && (
                        <div className="bg-surface-white p-7 rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                            <div className="flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-primary">settings</span>
                                <h3 className="font-headline-md text-headline-md text-primary">Hành động</h3>
                            </div>
                            <div className="space-y-3">
                                {mockOrder.status === 'PENDING' && (
                                    <button className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                            Xác nhận đơn hàng
                                        </span>
                                    </button>
                                )}
                                {mockOrder.status === 'CONFIRMED' && (
                                    <button className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                            Cập nhật vận chuyển
                                        </span>
                                    </button>
                                )}
                                <button className="w-full border border-red-200 text-red-600 py-3.5 rounded-xl font-label-bold hover:bg-red-50 transition-all">
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                        Hủy đơn hàng
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">{label}</span>
            <span className={valueClass || 'text-on-surface font-semibold'}>{value}</span>
        </div>
    );
}
