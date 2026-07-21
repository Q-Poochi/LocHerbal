'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductDetail } from '../../../types/api.types';
import { useAddToCart } from '../../../lib/hooks/useProducts';
import { useToast } from '../../../lib/providers/toast-provider';

interface ProductDetailClientProps {
    product: ProductDetail;
}

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
    const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id);
    const [quantity, setQuantity] = useState(1);
    const addToCartMutation = useAddToCart();
    const toast = useToast();
    const router = useRouter();

    const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

    return (
        <>
            {/* Variant Selector */}
            <div className="space-y-3">
                <p className="font-label-bold text-label-bold">Chọn phân loại</p>
                <div className="flex gap-3">
                    {product.variants.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            className={`px-4 py-2 rounded-lg font-label-bold transition-colors ${variant.id === selectedVariantId
                                ? 'border-2 border-primary bg-primary/5 text-primary'
                                : 'border border-outline-variant text-on-surface-variant hover:border-primary'
                                }`}
                            onClick={() => setSelectedVariantId(variant.id)}
                        >
                            {variant.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ingredients / Dosage / Contraindications (static) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-outline-variant/50 rounded-xl bg-surface-white">
                <div className="space-y-1">
                    <p className="text-caption text-outline uppercase tracking-wider">Thành phần chính</p>
                    <p className="font-body-md font-medium text-primary">{product.ingredients}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-caption text-outline uppercase tracking-wider">Liều dùng</p>
                    <p className="font-body-md font-medium text-primary">{product.dosage}</p>
                </div>
                {product.contraindications && (
                    <div className="col-span-full pt-2 border-t border-outline-variant/30">
                        <p className="text-caption text-error uppercase tracking-wider">Chống chỉ định</p>
                        <p className="text-body-sm text-on-surface-variant">{product.contraindications}</p>
                    </div>
                )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden h-12">
                        <button
                            type="button"
                            className="px-4 hover:bg-surface-container transition-colors material-symbols-outlined"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            remove
                        </button>
                        <input
                            className="w-12 text-center border-none focus:ring-0 font-bold"
                            type="number"
                            min={1}
                            value={quantity}
                            readOnly
                        />
                        <button
                            type="button"
                            className="px-4 hover:bg-surface-container transition-colors material-symbols-outlined"
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            add
                        </button>
                    </div>
                    <div className="text-body-sm">
                        <span className="text-on-surface-variant">Tình trạng: </span>
                        <span className="text-secondary font-bold">
                            Còn {selectedVariant?.stock || 0} sản phẩm
                        </span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        data-testid="product-detail-add-to-cart"
                        className="flex-1 h-14 bg-primary text-on-primary rounded-xl font-headline-md text-label-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                        onClick={() => {
                            if (selectedVariantId && quantity > 0) {
                                addToCartMutation.mutate(
                                    { productVariantId: selectedVariantId, qty: quantity },
                                    {
                                        onSuccess: () => {
                                            toast.success('Đã thêm vào giỏ hàng');
                                        },
                                        onError: (err: any) => {
                                            const msg = err?.response?.data?.message || 'Thêm vào giỏ thất bại';
                                            toast.error(msg);
                                        },
                                    },
                                );
                            }
                        }}
                        disabled={addToCartMutation.isPending}
                    >
                        <span className="material-symbols-outlined">shopping_bag</span>
                        Thêm vào giỏ hàng
                    </button>
                    <button
                        type="button"
                        className="flex-1 h-14 bg-secondary-container text-on-secondary-container rounded-xl font-headline-md text-label-bold flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
                        onClick={async () => {
                            if (selectedVariantId && quantity > 0) {
                                try {
                                    await addToCartMutation.mutateAsync({ productVariantId: selectedVariantId, qty: quantity });
                                    router.push('/checkout');
                                } catch (err: any) {
                                    const msg = err?.response?.data?.message || 'Thêm vào giỏ thất bại';
                                    toast.error(msg);
                                }
                            }
                        }}
                        disabled={addToCartMutation.isPending}
                    >
                        Mua ngay
                    </button>
                </div>
            </div>
        </>
    );
}