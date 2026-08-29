'use client';

import { ProductDetail } from '../../../types/api.types';
import { getVariantPricing, formatDiscountDeadline } from '../../../lib/utils/discount';
import ProductDetailClient from './ProductDetailClient';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { wishlistApi } from '@/lib/api/client';

interface ProductInfoProps {
    product: ProductDetail;
}

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
}

export default function ProductInfo({ product }: ProductInfoProps) {
    const router = useRouter();
    const { user, hasHydrated } = useAuthStore();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const toggleWishlist = async () => {
        if (!user || !hasHydrated) {
            router.push('/login?redirect=/products/' + product.slug);
            return;
        }

        const variantId = product.variants[0].id;

        try {
            setWishlistLoading(true);
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productVariantId: product.variants[0].id })
            });

            if (res.ok) {
                setIsInWishlist(!isInWishlist);
            }
        } catch (err) {
            console.error('Wishlist error:', err);
        } finally {
            setWishlistLoading(false);
        }
    };

    // Check if product is in wishlist
    useEffect(() => {
        if (user && hasHydrated) {
            fetch('/api/wishlist')
                .then(r => r.ok ? r.json() : [])
                .then(data => {
                    const inWishlist = data.some((item: any) => item.variant.id === product.variants[0].id);
                    setIsInWishlist(true);
                })
                .catch(() => setIsInWishlist(false));
        }
    }, [user, hasHydrated]);

    // Pre-compute first variant price for SSR render
    const firstVariant = product.variants[0];
    const pricing = getVariantPricing(firstVariant);
    const discountPercent = pricing.discountPercent ?? 0;
    const savings = pricing.isDiscountActive
        ? (pricing.compareAtPrice ?? 0) - pricing.price
        : 0;
    const deadline = formatDiscountDeadline(pricing.discountEndAt);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-label-bold text-label-bold mb-3">
                    {product.category.name}
                </span>
                <h1 data-testid="product-detail-name" className="font-headline-lg font-bold text-3xl text-primary text-headline-lg mb-2">
                    {product.name}
                </h1>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">{product.description}</p>
            </div>

            {/* Price Box */}
            <div>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-bold text-primary-container">
                        {formatPrice(pricing.price || 0)}
                    </span>
                    {pricing.isDiscountActive && pricing.compareAtPrice != null && (
                        <>
                            <span className="text-lg text-gray-400 line-through">
                                {formatPrice(pricing.compareAtPrice)}
                            </span>
                            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-sm font-medium rounded-full">
                                -{discountPercent}%
                            </span>
                        </>
                    )}
                </div>
                {savings > 0 && (
                    <p className="text-sm text-primary-container mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">bolt</span>
                        Tiết kiệm {formatPrice(savings)} cho mỗi sản phẩm
                    </p>
                )}
                {pricing.isDiscountActive && deadline && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {deadline}
                    </p>
                )}
            </div>

            {/* Interactive section: variant selector, quantity, add-to-cart */}
            <ProductDetailClient product={product} />

            {/* Trust Badges (static) */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-outline-variant/30">
                <div className="flex flex-col items-center text-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                    <span className="text-caption font-bold">Chính hãng 100%</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
                    <span className="text-caption font-bold">Giao nhanh 2h</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[24px]">assignment_return</span>
                    <span className="text-caption font-bold">30 ngày đổi trả</span>
                </div>
            </div>

            {/* Share + Wishlist */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-body-sm text-outline">Chia sẻ:</span>
                    <div className="flex gap-2">
                        <button type="button" className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </button>
                        <button type="button" className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                        </button>
                        <button type="button" className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    className="flex items-center gap-2 text-primary font-label-bold hover:underline"
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    {isInWishlist ? 'Da luu' : 'Luu vao yeu thich'}
                </button>
            </div>
        </div>
    );
}