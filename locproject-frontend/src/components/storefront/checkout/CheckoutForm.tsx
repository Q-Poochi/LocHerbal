'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PaymentSelector, { PaymentMethod } from './PaymentSelector';

const checkoutSchema = z.object({
    fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
    phone: z
        .string()
        .min(1, 'Số điện thoại là bắt buộc')
        .regex(/(03|05|07|08|09)[0-9]{8}/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    province: z.string().min(1, 'Tỉnh/Thành phố là bắt buộc'),
    district: z.string().min(1, 'Quận/Huyện là bắt buộc'),
    ward: z.string().min(1, 'Phường/Xã là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ cụ thể là bắt buộc'),
    note: z.string().optional(),
    paymentMethod: z.enum(['vnpay', 'momo', 'cod']),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface Province {
    code: number;
    name: string;
}
interface District {
    code: number;
    name: string;
}
interface Ward {
    code: number;
    name: string;
}

interface CheckoutFormProps {
    defaultValues?: Partial<CheckoutFormData>;
    isPending: boolean;
    onSubmit: (data: CheckoutFormData) => void;
}

const API = 'https://provinces.open-api.vn/api';

export default function CheckoutForm({ defaultValues, isPending, onSubmit }: CheckoutFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            paymentMethod: 'vnpay',
            ...defaultValues,
        },
    });

    // Load provinces on mount
    useEffect(() => {
        fetch(`${API}/p/`)
            .then((r) => r.json())
            .then((data: Province[]) => setProvinces(data))
            .catch(() => setProvinces([]));
    }, []);

    const provinceCode = watch('province');
    const districtCode = watch('district');

    // Load districts when province changes
    useEffect(() => {
        if (!provinceCode) {
            setDistricts([]);
            setWards([]);
            return;
        }
        fetch(`${API}/p/${provinceCode}?depth=2`)
            .then((r) => r.json())
            .then((data: any) => setDistricts(data.districts || []))
            .catch(() => setDistricts([]));
        setValue('district', '');
        setValue('ward', '');
    }, [provinceCode, setValue]);

    // Load wards when district changes
    useEffect(() => {
        if (!districtCode) {
            setWards([]);
            return;
        }
        fetch(`${API}/d/${districtCode}?depth=2`)
            .then((r) => r.json())
            .then((data: any) => setWards(data.wards || []))
            .catch(() => setWards([]));
        setValue('ward', '');
    }, [districtCode, setValue]);

    const goToStep = (step: number) => setCurrentStep(step);

    return (
        <div className="lg:col-span-8 space-y-gutter">
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Shipping Information */}
                <section
                    className={`bg-surface-white p-6 md:p-8 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] transition-all ${currentStep === 1 ? '' : 'hidden'
                        }`}
                >
                    <h2 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">local_shipping</span>
                        Thông tin giao hàng
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                Họ và tên *
                            </label>
                            <input
                                {...register('fullName')}
                                data-testid="checkout-fullName"
                                className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                placeholder="Nguyễn Văn A"
                            />
                            {errors.fullName && <p className="text-error text-sm mt-1">{errors.fullName.message}</p>}
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                Số điện thoại *
                            </label>
                            <input
                                {...register('phone')}
                                data-testid="checkout-phone"
                                className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                placeholder="0901234567"
                            />
                            {errors.phone && <p className="text-error text-sm mt-1">{errors.phone.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                Email (Không bắt buộc)
                            </label>
                            <input
                                {...register('email')}
                                className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                placeholder="example@gmail.com"
                                type="email"
                            />
                            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                    Tỉnh / Thành phố *
                                </label>
                                <select
                                    {...register('province')}
                                    className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                >
                                    <option value="">Chọn Tỉnh/Thành</option>
                                    {provinces.map((p) => (
                                        <option key={p.code} value={p.code}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.province && <p className="text-error text-sm mt-1">{errors.province.message}</p>}
                            </div>
                            <div>
                                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                    Quận / Huyện *
                                </label>
                                <select
                                    {...register('district')}
                                    disabled={!provinceCode}
                                    className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all disabled:opacity-50"
                                >
                                    <option value="">{provinceCode ? 'Chọn Quận/Huyện' : 'Chọn Tỉnh trước'}</option>
                                    {districts.map((d) => (
                                        <option key={d.code} value={d.code}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.district && <p className="text-error text-sm mt-1">{errors.district.message}</p>}
                            </div>
                            <div>
                                <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                    Phường / Xã *
                                </label>
                                <select
                                    {...register('ward')}
                                    disabled={!districtCode}
                                    className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all disabled:opacity-50"
                                >
                                    <option value="">{districtCode ? 'Chọn Phường/Xã' : 'Chọn Quận trước'}</option>
                                    {wards.map((w) => (
                                        <option key={w.code} value={w.code}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.ward && <p className="text-error text-sm mt-1">{errors.ward.message}</p>}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                Địa chỉ cụ thể *
                            </label>
                            <input
                                {...register('address')}
                                data-testid="checkout-address"
                                className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                placeholder="Số nhà, tên đường..."
                            />
                            {errors.address && <p className="text-error text-sm mt-1">{errors.address.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1">
                                Ghi chú đơn hàng
                            </label>
                            <textarea
                                {...register('note')}
                                className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                // Validate step 1 fields before proceeding
                                handleSubmit(() => goToStep(2))();
                            }}
                            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Tiếp tục thanh toán
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </section>

                {/* Step 2: Payment Method */}
                <section
                    className={`bg-surface-white p-6 md:p-8 rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] transition-all ${currentStep === 2 ? '' : 'hidden'
                        }`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined">payments</span>
                            Phương thức thanh toán
                        </h2>
                        <button
                            type="button"
                            className="text-primary font-label-bold hover:underline"
                            onClick={() => goToStep(1)}
                        >
                            Quay lại
                        </button>
                    </div>
                    <Controller
                        control={control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <PaymentSelector
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-lg font-label-bold hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
                        >
                            {isPending ? 'Đang xử lý...' : 'Đặt hàng & Thanh toán'}
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}