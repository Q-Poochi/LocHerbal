'use client';

export type PaymentMethod = 'vnpay' | 'momo' | 'cod';

interface PaymentSelectorProps {
    value: PaymentMethod;
    onChange: (value: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: string; disabled?: boolean }[] = [
    { value: 'vnpay', label: 'VNPay', desc: 'Thẻ ATM/QR Code', icon: 'credit_card' },
    // MoMo tạm ẩn: chưa có backend integration (chỉ có VNPay service) — bật lại khi implement MoMo IPN
    { value: 'momo', label: 'MoMo', desc: 'Sắp ra mắt', icon: 'phone_iphone', disabled: true },
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
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-colors ${
                            opt.disabled
                                ? 'border-[#c1c8c2] opacity-50 cursor-not-allowed'
                                : selected
                                ? 'border-[#1b4332] bg-[#f0eee8] cursor-pointer'
                                : 'border-[#c1c8c2] hover:border-[#1b4332]/50 cursor-pointer'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment"
                            value={opt.value}
                            checked={selected}
                            onChange={() => !opt.disabled && onChange(opt.value)}
                            disabled={opt.disabled}
                            className="accent-[#1b4332]"
                        />
                        <span className={`material-symbols-outlined ${opt.disabled ? 'text-[#8a938e]' : 'text-[#1b4332]'}`}>{opt.icon}</span>
                        <div>
                            <p className={`font-medium text-sm ${opt.disabled ? 'text-[#8a938e]' : 'text-[#1b1c18]'}`}>{opt.label}</p>
                            <p className="text-xs text-[#414844]">{opt.desc}</p>
                        </div>
                    </label>
                );
            })}
        </div>
    );
}
