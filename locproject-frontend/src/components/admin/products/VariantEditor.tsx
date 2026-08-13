'use client';

import { useState, useEffect, useRef } from 'react';

export interface Variant {
    id: string;
    sku: string;
    name: string;
    price: number;
    compareAtPrice: number;
    stock: number;
    marketPrice: number;
    marketPriceSource: string;
    discountStartAt: string;
    discountEndAt: string;
}

export interface RefPriceResult {
    found: boolean;
    productName?: string;
    minPrice?: number;
    maxPrice?: number;
    source?: string;
    category?: string;
    price?: number;
    name?: string;
}

interface VariantEditorProps {
    productName?: string;
    variants?: Variant[];
    onChange?: (variants: Variant[]) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const EMPTY_VARIANT = (): Variant => ({
    id: String(Date.now()),
    sku: '',
    name: '',
    price: 0,
    compareAtPrice: 0,
    stock: 0,
    marketPrice: 0,
    marketPriceSource: '',
    discountStartAt: '',
    discountEndAt: '',
});

export default function VariantEditor({ productName, variants, onChange }: VariantEditorProps) {
    const [refPrice, setRefPrice] = useState<RefPriceResult | null>(null);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Tra cứu giá tham khảo khi productName thay đổi
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!productName || productName.trim().length < 2) {
            setRefPrice(null);
            return;
        }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/products/reference-price?name=${encodeURIComponent(productName)}`);
                const data = await res.json();
                setRefPrice(data);
            } catch {
                setRefPrice(null);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [productName]);

    const current = variants ?? [];

    const commit = (next: Variant[]) => {
        onChange?.(next);
    };

    const addVariant = () => {
        commit([...current, EMPTY_VARIANT()]);
    };

    const updateVariant = (id: string, patch: Partial<Variant>) => {
        commit(current.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    };

    const removeVariant = (id: string) => {
        commit(current.filter((v) => v.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-primary">Biến thể & Giá</h3>
                <button
                    onClick={addVariant}
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-bold text-label-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm biến thể
                </button>
            </div>

            {/* Giá tham khảo thị trường (AI) */}
            {loading && (
                <div className="bg-surface-container-low border border-tertiary-container rounded-xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary animate-spin">progress_activity</span>
                    <span className="text-body-sm text-on-surface-variant">Đang tra cứu giá thị trường...</span>
                </div>
            )}

            {refPrice && !loading && (
                <div className={`rounded-xl p-4 flex items-start gap-3 ${refPrice.found ? 'bg-surface-container-low border border-tertiary-container' : 'bg-amber-50 border border-amber-200'}`}>
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${refPrice.found ? 'text-tertiary' : 'text-amber-500'}`}>
                        {refPrice.found ? 'check_circle' : 'travel_explore'}
                    </span>
                    <div className="flex-1">
                        <p className="font-label-bold text-label-bold text-primary">
                            {refPrice.found ? 'Giá tham khảo thị trường' : 'AI gợi ý giá tham khảo'}
                        </p>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                            <strong>{refPrice.productName || refPrice.name || productName}</strong>:{' '}
                            {Number(refPrice.minPrice).toLocaleString('vi-VN')}đ – {Number(refPrice.maxPrice).toLocaleString('vi-VN')}đ
                            {refPrice.category && <span className="ml-2 text-caption">({refPrice.category})</span>}
                        </p>
                        <p className="text-caption text-on-surface-variant mt-0.5">
                            Nguồn: {refPrice.source}
                        </p>
                    </div>
                </div>
            )}

            {current.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant text-body-sm border-2 border-dashed border-outline-variant rounded-xl">
                    Chưa có biến thể nào. Nhấn &ldquo;Thêm biến thể&rdquo; để bắt đầu.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {current.map((v) => (
                    <VariantCard
                        key={v.id}
                        variant={v}
                        refPrice={refPrice}
                        onUpdate={(patch) => updateVariant(v.id, patch)}
                        onRemove={() => removeVariant(v.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function VariantCard({
    variant: v,
    refPrice,
    onUpdate,
    onRemove,
}: {
    variant: Variant;
    refPrice: RefPriceResult | null;
    onUpdate: (patch: Partial<Variant>) => void;
    onRemove: () => void;
}) {
    const discountOn = v.compareAtPrice > 0;

    const toggleDiscount = (on: boolean) => {
        if (on) {
            // Bật: giữ nguyên so với giá bán, admin tự nhập % / giá gốc
            onUpdate({ compareAtPrice: v.compareAtPrice > 0 ? v.compareAtPrice : v.price || 0 });
        } else {
            // Tắt: xoá giá gốc để không còn hiển thị gạch ngang
            onUpdate({ compareAtPrice: 0, discountStartAt: '', discountEndAt: '' });
        }
    };

    // % giảm tính từ giá gốc & giá bán
    const discountPct =
        v.compareAtPrice > v.price
            ? Math.round((1 - v.price / v.compareAtPrice) * 100)
            : 0;

    const updatePercent = (pct: number) => {
        if (v.compareAtPrice <= 0) return;
        const price = Math.round((v.compareAtPrice * (100 - pct)) / 100);
        onUpdate({ price });
    };

    const updatePriceFromManual = (price: number) => {
        onUpdate({ price });
    };

    const previewActive = discountOn && v.compareAtPrice > v.price;

    return (
        <div className="border border-outline-variant rounded-xl p-5 bg-surface-white shadow-sm hover:shadow-md transition-shadow relative group">
            {/* Nút xoá */}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 w-7 h-7 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {/* Dòng 1: Tên biến thể + SKU */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                    <label className="font-label-bold text-caption text-on-surface-variant">
                        Tên biến thể
                    </label>
                    <input
                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                        placeholder="VD: Hộp 30 viên"
                        value={v.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-label-bold text-caption text-on-surface-variant">
                        SKU
                    </label>
                    <input
                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                        placeholder="VD: LH-TM-001-30V"
                        value={v.sku}
                        onChange={(e) => onUpdate({ sku: e.target.value })}
                    />
                </div>
            </div>

            {/* Dòng 2: Giá bán + Tồn kho */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                    <label className="font-label-bold text-caption text-on-surface-variant">
                        Giá bán (đ)
                    </label>
                    <input
                        type="number"
                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                        placeholder="0"
                        value={v.price || ''}
                        onChange={(e) => updatePriceFromManual(Number(e.target.value))}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="font-label-bold text-caption text-on-surface-variant text-center">
                        Tồn kho
                    </label>
                    <input
                        type="number"
                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-center focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                        placeholder="0"
                        value={v.stock || ''}
                        onChange={(e) => onUpdate({ stock: Number(e.target.value) })}
                    />
                </div>
            </div>

            {/* Khuyến mãi / Giảm giá */}
            <div className="border border-tertiary-container/60 rounded-xl overflow-hidden mb-4">
                <div className="bg-tertiary-container/30 px-4 py-3 flex items-center justify-between">
                    <span className="font-label-bold text-label-bold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-tertiary">percent</span>
                        Khuyến mãi / Giảm giá
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={discountOn}
                            onChange={(e) => toggleDiscount(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary" />
                    </label>
                </div>

                {discountOn ? (
                    <div className="p-4 space-y-4 bg-surface-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    Giá gốc (đ)
                                </label>
                                <input
                                    type="number"
                                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                    placeholder="0"
                                    value={v.compareAtPrice || ''}
                                    onChange={(e) => onUpdate({ compareAtPrice: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    % giảm
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                        placeholder="0"
                                        min={0}
                                        max={100}
                                        value={discountPct || ''}
                                        onChange={(e) => updatePercent(Number(e.target.value))}
                                    />
                                    <span className="text-body-sm text-on-surface-variant">%</span>
                                </div>
                                <p className="text-caption text-tertiary">
                                    Giá bán: {v.price.toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    Bắt đầu
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                    value={v.discountStartAt}
                                    onChange={(e) => onUpdate({ discountStartAt: e.target.value })}
                                />
                                <p className="text-caption text-on-surface-variant">Để trống = áp dụng ngay</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    Kết thúc
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                    value={v.discountEndAt}
                                    onChange={(e) => onUpdate({ discountEndAt: e.target.value })}
                                />
                                <p className="text-caption text-on-surface-variant">Để trống = áp dụng vĩnh viễn</p>
                            </div>
                        </div>

                        {/* Preview y hệt frontend */}
                        <div className="bg-surface-container-low rounded-lg px-4 py-3 flex items-center gap-3">
                            {previewActive ? (
                                <>
                                    <span className="font-bold text-body-md text-error">
                                        {v.price.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="text-caption text-on-surface-variant line-through">
                                        {v.compareAtPrice.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="bg-error text-on-error text-caption font-bold px-2 py-0.5 rounded-full">
                                        -{discountPct}%
                                    </span>
                                </>
                            ) : (
                                <span className="text-caption text-on-surface-variant">
                                    Giảm giá chưa kích hoạt (giá gốc phải lớn hơn giá bán).
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-surface-white">
                        <p className="text-caption text-on-surface-variant">
                            Đang tắt. Bật lên để nhập giá gốc và % giảm giá.
                        </p>
                    </div>
                )}
            </div>

            {/* Giá tham khảo thị trường + Nguồn */}
            <div className="border-t border-outline-variant/30 pt-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 col-span-2">
                        <label className="font-label-bold text-caption text-tertiary">
                            Giá tham khảo thị trường (đ)
                        </label>
                        <input
                            type="number"
                            className="w-full border border-tertiary-container rounded-lg px-3 py-2 text-body-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary/10 transition-all"
                            placeholder={refPrice ? `${refPrice.minPrice?.toLocaleString('vi-VN')} – ${refPrice.maxPrice?.toLocaleString('vi-VN')}` : '0'}
                            value={v.marketPrice || ''}
                            onChange={(e) => onUpdate({ marketPrice: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-label-bold text-caption text-tertiary">
                            Nguồn
                        </label>
                        <input
                            className="w-full border border-tertiary-container rounded-lg px-3 py-2 text-body-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary/10 transition-all"
                            placeholder={refPrice?.source || 'Nhà thuốc...'}
                            value={v.marketPriceSource}
                            onChange={(e) => onUpdate({ marketPriceSource: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}