'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../../types/api.types';
import { useAddToCart } from '../../lib/hooks/useProducts';
import { useToast } from '../../lib/providers/toast-provider';

interface ProductGridDisplayProps {
    products: Product[];
}

export default function ProductGridDisplay({ products }: ProductGridDisplayProps) {
    const addToCartMutation = useAddToCart();
    const toast = useToast();

    const handleAddToCart = (variantId: string | undefined, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!variantId) {
            toast.error('Sản phẩm không có biến thể để thêm vào giỏ hàng');
            return;
        }

        addToCartMutation.mutate(
            { productVariantId: variantId, qty: 1 },
            {
                onSuccess: () => {
                    toast.success('Đã thêm vào giỏ hàng');
                },
                onError: (err: any) => {
                    const msg = err?.response?.data?.message || 'Thêm vào giỏ thất bại';
                    toast.error(msg);
                },
            }
        );
    };
    if (!products.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <span className="material-symbols-outlined text-[48px] text-outline mb-4">inventory_2</span>
                <h3 className="font-headline-md text-headline-md text-primary mb-2">Chưa có sản phẩm</h3>
                <p className="text-body-sm text-on-surface-variant">Danh mục này đang được cập nhật.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
            {products.map((product: Product, index: number) => {
                const i = index + 1;
                const mainVariant = product.variants?.[0];
                const isBestseller = i % 3 === 0;

                return (
                    <div key={product.id} className="product-card group relative bg-surface-white rounded-xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-lg border border-transparent hover:border-outline-variant">
                        <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                            {product.thumbnailUrl && (
                                <Image
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                    fill
                                />
                            )}

                            <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container text-body-sm font-bold px-2 py-1 rounded uppercase">
                                {product.category?.name}
                            </div>

                            {mainVariant?.compareAtPrice && i === 1 && (
                                <div className="absolute top-3 right-3 bg-error text-white text-body-sm font-bold px-2 py-1 rounded">
                                    -15%
                                </div>
                            )}

                            {isBestseller && i !== 1 && (
                                <div className="absolute top-3 right-3 bg-secondary text-white text-body-sm font-bold px-2 py-1 rounded">
                                    Bestseller
                                </div>
                            )}

                            {/* Quick View Overlay */}
                            <div className="quick-view-btn absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                                <Link href={`/products/${product.slug}`} data-testid={`product-card-link-${product.slug}`} className="bg-white text-primary px-6 py-2 rounded-full font-label-bold text-body-sm shadow-lg hover:bg-primary hover:text-white transition-colors">
                                    Xem nhanh
                                </Link>
                            </div>
                        </div>

                        <div className="p-4">
                            <Link href={`/products/${product.slug}`} data-testid={`product-title-link-${product.slug}`} className="block">
                                <h3 className="text-headline-md font-bold text-primary line-clamp-2 min-h-[48px] mb-2 group-hover:text-secondary transition-colors">
                                    {product.name}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-2">
                                <span className={`${mainVariant?.compareAtPrice ? 'text-error' : 'text-primary'} font-bold text-body-lg`}>
                                    {(mainVariant?.price ?? 0).toLocaleString('vi-VN')}đ
                                </span>
                                {mainVariant?.compareAtPrice && (
                                    <span className="text-outline text-caption line-through">
                                        {(mainVariant.compareAtPrice ?? 0).toLocaleString('vi-VN')}đ
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 mb-4">
                                <span className="material-symbols-outlined text-[14px] text-success-leaf filled-icon" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                <span className="text-body-sm text-success-leaf font-medium">Còn hàng</span>
                            </div>

                            <button
                                type="button"
                                data-testid={`add-to-cart-btn-${product.slug}`}
                                onClick={(e) => handleAddToCart(mainVariant?.id, e)}
                                disabled={addToCartMutation.isPending}
                                className="w-full py-2.5 bg-primary text-white rounded-lg font-label-bold text-body-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                                {addToCartMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}