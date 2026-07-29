'use client';

export type PaymentMethod = 'vnpay' | 'momo' | 'cod';

interface PaymentSelectorProps {
    value: PaymentMethod;
    onChange: (value: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: string }[] = [
    { value: 'vnpay', label: 'VNPay', desc: 'Thẻ ATM/QR Code', icon: 'credit_card' },
    { value: 'momo', label: 'MoMo', desc: 'Ví điện tử MoMo', icon: 'phone_iphone' },
    { value: 'cod', label: 'COD', desc: 'Thanh toán khi nhận hàng', icon: 'local_shipping' },
];

export default function PaymentSelector({ value, onChange }: PaymentSelectorProps) {
    return (
        <div className="space-y-3">
            {OPTIONS.map((opt) => {
                const selected = value === opt.value;
                return (
                    <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                            selected
                                ? 'border-[#1b4332] bg-[#f0eee8]'
                                : 'border-[#c1c8c2] hover:border-[#1b4332]/50'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value={opt.value}
                            checked={selected}
                            onChange={() => onChange(opt.value)}
                            className="accent-[#1b4332]"
                        />
                        <span className="material-symbols-outlined text-[#1b4332]">{opt.icon}</span>
                        <div>
                            <p className="font-medium text-[#1b1c18] text-sm">{opt.label}</p>
                            <p className="text-xs text-[#414844]">{opt.desc}</p>
                        </div>
                    </label>
                );
            })}
        </div>
    );
}
