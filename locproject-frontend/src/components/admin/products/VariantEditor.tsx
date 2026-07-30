'use client';

import { useState, useEffect, useRef } from 'react';

interface Variant {
    id: string;
    sku: string;
    name: string;
    price: number;
    compareAtPrice: number;
    stock: number;
    marketPrice: number;
    marketPriceSource: string;
}

interface RefPriceResult {
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function VariantEditor({ productName }: VariantEditorProps) {
    const [variants, setVariants] = useState<Variant[]>([
        { id: '1', sku: '', name: 'Hộp 30 viên', price: 0, compareAtPrice: 0, stock: 0, marketPrice: 0, marketPriceSource: '' },
        { id: '2', sku: '', name: 'Hộp 60 viên', price: 0, compareAtPrice: 0, stock: 0, marketPrice: 0, marketPriceSource: '' },
    ]);

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

    const addVariant = () => {
        const newId = String(Date.now());
        setVariants((prev) => [
            ...prev,
            { id: newId, sku: '', name: '', price: 0, compareAtPrice: 0, stock: 0, marketPrice: 0, marketPriceSource: '' },
        ]);
    };

    const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
        setVariants((prev) =>
            prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
        );
    };

    const removeVariant = (id: string) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
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

            {variants.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant text-body-sm border-2 border-dashed border-outline-variant rounded-xl">
                    Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variants.map((v) => (
                    <div
                        key={v.id}
                        className="border border-outline-variant rounded-xl p-5 bg-surface-white shadow-sm hover:shadow-md transition-shadow relative group"
                    >
                        {/* Nút xoá */}
                        <button
                            onClick={() => removeVariant(v.id)}
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
                                    onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
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
                                    onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Dòng 2: Giá bán + Giá gốc + Tồn kho */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    Giá bán (đ)
                                </label>
                                <input
                                    type="number"
                                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                    placeholder="0"
                                    value={v.price || ''}
                                    onChange={(e) =>
                                        updateVariant(v.id, 'price', Number(e.target.value))
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-label-bold text-caption text-on-surface-variant">
                                    Giá gốc (đ)
                                </label>
                                <input
                                    type="number"
                                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                                    placeholder="0"
                                    value={v.compareAtPrice || ''}
                                    onChange={(e) =>
                                        updateVariant(v.id, 'compareAtPrice', Number(e.target.value))
                                    }
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
                                    onChange={(e) =>
                                        updateVariant(v.id, 'stock', Number(e.target.value))
                                    }
                                />
                            </div>
                        </div>

                        {/* Dòng 3: Giá tham khảo thị trường + Nguồn */}
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
                                        onChange={(e) =>
                                            updateVariant(v.id, 'marketPrice', Number(e.target.value))
                                        }
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
                                        onChange={(e) =>
                                            updateVariant(v.id, 'marketPriceSource', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
