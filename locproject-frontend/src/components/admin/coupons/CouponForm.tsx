'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCoupon, useUpdateCoupon, type AdminCoupon } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';

function toDateInput(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface CouponFormProps {
    coupon?: AdminCoupon;
}

export default function CouponForm({ coupon }: CouponFormProps) {
    const router = useRouter();
    const toast = useToast();
    const isEdit = !!coupon;

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState('');
    const [minOrderValue, setMinOrderValue] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (coupon) {
            setCode(coupon.code);
            setDiscountType(coupon.discountType);
            setDiscountValue(String(coupon.discountValue));
            setMinOrderValue(coupon.minOrderValue > 0 ? String(coupon.minOrderValue) : '');
            setUsageLimit(coupon.usageLimit != null ? String(coupon.usageLimit) : '');
            setStartDate(toDateInput(coupon.startDate));
            setEndDate(toDateInput(coupon.endDate));
            setIsActive(coupon.isActive);
        }
    }, [coupon]);

    const createMutation = useCreateCoupon();
    const updateMutation = useUpdateCoupon();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const validate = (): string | null => {
        const finalCode = code.trim().toUpperCase();
        if (!finalCode) return 'Vui lòng nhập mã giảm giá';
        const value = Number(discountValue);
        if (!discountValue || Number.isNaN(value) || value <= 0) return 'Giá trị giảm giá phải lớn hơn 0';
        if (discountType === 'PERCENTAGE' && value > 100) return 'Phần trăm giảm tối đa là 100%';
        if (!startDate || !endDate) return 'Vui lòng chọn ngày bắt đầu và kết thúc';
        if (new Date(endDate) < new Date(startDate)) return 'Ngày kết thúc phải sau ngày bắt đầu';
        if (minOrderValue && (Number(minOrderValue) < 0 || Number.isNaN(Number(minOrderValue)))) return 'Giá trị đơn tối thiểu không hợp lệ';
        if (usageLimit && (Number(usageLimit) <= 0 || Number.isNaN(Number(usageLimit)))) return 'Số lượt dùng phải là số nguyên dương';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }
        const base = {
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
            usageLimit: usageLimit ? Number(usageLimit) : undefined,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate + 'T23:59:59').toISOString(),
        };
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: coupon.id, payload: { ...base, isActive } });
                toast.success('Đã cập nhật mã giảm giá');
            } else {
                await createMutation.mutateAsync(base);
                toast.success('Đã tạo mã giảm giá');
            }
            router.push('/admin/coupons');
            router.refresh();
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể lưu mã giảm giá'));
        }
    };

    const label = 'font-label-bold text-label-bold text-primary';
    const field =
        'w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors';

    return (
        <form onSubmit={handleSubmit}>
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-8">
                <span>Nội dung</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span>Ưu đãi</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">{isEdit ? 'Chỉnh sửa mã' : 'Tạo mã mới'}</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">{isEdit ? 'Chỉnh sửa Ưu đãi' : 'Tạo Ưu đãi mới'}</h2>

            <section className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6 max-w-[760px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="coupon-code" className={label}>
                            Mã giảm giá <span className="text-error">*</span>
                        </label>
                        <input
                            id="coupon-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="VD: GIAM10"
                            className={`${field} mt-2 font-mono`}
                        />
                        <p className="text-xs text-text-tertiary mt-1">Tự động chuyển thành chữ hoa. Ví dụ: SALE10.</p>
                    </div>
                    <div>
                        <label htmlFor="coupon-type" className={label}>
                            Loại giảm giá
                        </label>
                        <select id="coupon-type" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')} className={`${field} mt-2`}>
                            <option value="PERCENTAGE">% theo đơn</option>
                            <option value="FIXED_AMOUNT">Số tiền cố định</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="coupon-value" className={label}>
                            Giá trị {discountType === 'PERCENTAGE' ? '(%)' : '(VND)'}
                        </label>
                        <input
                            id="coupon-value"
                            type="number"
                            min={0}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'PERCENTAGE' ? '10' : '50000'}
                            className={`${field} mt-2`}
                        />
                    </div>
                    <div>
                        <label htmlFor="coupon-min" className={label}>
                            Đơn tối thiểu (VND)
                        </label>
                        <input
                            id="coupon-min"
                            type="number"
                            min={0}
                            value={minOrderValue}
                            onChange={(e) => setMinOrderValue(e.target.value)}
                            placeholder="0"
                            className={`${field} mt-2`}
                        />
                    </div>
                    <div>
                        <label htmlFor="coupon-limit" className={label}>
                            Số lượt dùng tối đa
                        </label>
                        <input
                            id="coupon-limit"
                            type="number"
                            min={1}
                            value={usageLimit}
                            onChange={(e) => setUsageLimit(e.target.value)}
                            placeholder="Không giới hạn"
                            className={`${field} mt-2`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="coupon-start" className={label}>
                            Ngày bắt đầu
                        </label>
                        <input id="coupon-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${field} mt-2`} />
                    </div>
                    <div>
                        <label htmlFor="coupon-end" className={label}>
                            Ngày kết thúc
                        </label>
                        <input id="coupon-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${field} mt-2`} />
                    </div>
                </div>

                {isEdit && (
                    <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                        <div>
                            <p className="font-semibold text-primary text-body-md">Kích hoạt mã</p>
                            <p className="text-sm text-text-tertiary mt-0.5">Mã được kích hoạt mới được sử dụng khi thanh toán.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive((v) => !v)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-outline-variant'}`}
                            aria-label={isActive ? 'Mã đang kích hoạt' : 'Mã đang tắt'}
                        >
                            <span
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                            />
                        </button>
                    </div>
                )}

                {isEdit && coupon.usedCount > 0 && (
                    <div className="flex items-center gap-3 rounded-xl bg-warning-container/10 border border-warning-container px-4 py-3">
                        <span className="material-symbols-outlined text-warning">warning</span>
                        <div>
                            <p className="text-sm font-semibold text-primary">Mã này đã được dùng {coupon.usedCount} lần.</p>
                            <p className="text-xs text-text-tertiary mt-0.5">Thay đổi giá trị có thể ảnh hưởng các đơn chưa thanh toán đang áp dụng mã.</p>
                        </div>
                    </div>
                )}
            </section>

            <div className="flex justify-between items-center pt-6 max-w-[760px]">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors"
                    disabled={isPending}
                >
                    Quay lại
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-8 py-3 rounded-xl bg-primary-container text-white font-label-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                    {isPending && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                    {isEdit ? 'Cập nhật mã' : 'Tạo mã'}
                </button>
            </div>
        </form>
    );
}