'use client';

import { useState } from 'react';

interface Variant {
    id: string;
    sku: string;
    name: string;
    originalPrice: number;
    salePrice: number;
    stock: number;
}

export default function VariantEditor() {
    const [variants, setVariants] = useState<Variant[]>([
        { id: '1', sku: 'AT-100G', name: 'Hũ 100g', originalPrice: 150000, salePrice: 129000, stock: 50 },
        { id: '2', sku: 'AT-250G', name: 'Hũ 250g', originalPrice: 350000, salePrice: 299000, stock: 12 },
    ]);

    const addVariant = () => {
        const newId = String(Date.now());
        setVariants((prev) => [
            ...prev,
            { id: newId, sku: '', name: '', originalPrice: 0, salePrice: 0, stock: 0 },
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

    const formatPrice = (price: number) =>
        price.toLocaleString('vi-VN') + 'đ';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-primary">Danh sách biến thể</h3>
                <button
                    onClick={addVariant}
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-bold text-label-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm biến thể
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-outline-variant">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-primary text-on-primary">
                        <tr>
                            <th className="px-4 py-3 font-label-bold text-label-bold">SKU</th>
                            <th className="px-4 py-3 font-label-bold text-label-bold">Tên biến thể</th>
                            <th className="px-4 py-3 font-label-bold text-label-bold text-right">Giá gốc</th>
                            <th className="px-4 py-3 font-label-bold text-label-bold text-right">Giá bán</th>
                            <th className="px-4 py-3 font-label-bold text-label-bold text-center">Kho</th>
                            <th className="px-4 py-3 font-label-bold text-label-bold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {variants.map((v) => (
                            <tr
                                key={v.id}
                                className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <input
                                        className="w-full border-outline-variant rounded text-body-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={v.sku}
                                        onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        className="w-full border-outline-variant rounded text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={v.name}
                                        onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        className="w-full border-outline-variant rounded text-body-sm text-right focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={v.originalPrice || ''}
                                        onChange={(e) =>
                                            updateVariant(v.id, 'originalPrice', Number(e.target.value))
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        className="w-full border-outline-variant rounded text-body-sm text-right font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={v.salePrice || ''}
                                        onChange={(e) =>
                                            updateVariant(v.id, 'salePrice', Number(e.target.value))
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input
                                        type="number"
                                        className="w-20 border-outline-variant rounded text-body-sm text-center focus:border-primary focus:ring-1 focus:ring-primary/10"
                                        value={v.stock || ''}
                                        onChange={(e) =>
                                            updateVariant(v.id, 'stock', Number(e.target.value))
                                        }
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => removeVariant(v.id)}
                                        className="material-symbols-outlined text-error cursor-pointer hover:opacity-80"
                                    >
                                        delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {variants.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant text-body-sm">
                                    Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}