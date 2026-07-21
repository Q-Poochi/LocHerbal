'use client';

export type PaymentMethod = 'vnpay' | 'momo' | 'cod';

interface PaymentSelectorProps {
    value: PaymentMethod;
    onChange: (value: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; title: string; desc: string; icon: string; color: string }[] = [
    {
        value: 'vnpay',
        title: 'Thanh toán qua VNPay',
        desc: 'Thanh toán an toàn qua cổng VNPay (ATM/QR Code)',
        icon: 'account_balance',
        color: 'text-accent',
    },
    {
        value: 'momo',
        title: 'Ví điện tử MoMo',
        desc: 'Thanh toán nhanh chóng bằng ứng dụng MoMo',
        icon: 'smartphone',
        color: 'text-accent',
    },
    {
        value: 'cod',
        title: 'Thanh toán khi nhận hàng (COD)',
        desc: 'Thanh toán bằng tiền mặt khi shipper giao hàng',
        icon: 'handshake',
        color: 'text-accent',
    },
];

export default function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
    return (
        <div className="space-y-4">
            {OPTIONS.map((opt) => {
                const selected = value === opt.value;
                return (
                    <div key={opt.value} className="payment-option">
                        <input
                            type="radio"
                            id={opt.value}
                            className="hidden"
                            checked={selected}
                            onChange={() => onChange(opt.value)}
                        />
                        <label
                            htmlFor={opt.value}
                            className={`flex items-center gap-4 p-4 border border-outline-variant rounded-lg cursor-pointer transition-all hover:bg-surface-container-low ${selected ? 'border-accent bg-surface-container-low ring-1 ring-accent' : ''
                                }`}
                        >
                            <div className="w-12 h-12 flex items-center justify-center bg-surface-container-low rounded-lg">
                                <span className={`material-symbols-outlined ${opt.color}`}>{opt.icon}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-label-bold text-primary">{opt.title}</p>
                                <p className="text-body-sm text-on-surface-variant">{opt.desc}</p>
                            </div>
                            <span
                                className={`material-symbols-outlined text-accent transition-opacity ${selected ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                check_circle
                            </span>
                        </label>
                    </div>
                );
            })}
        </div>
    );
}
