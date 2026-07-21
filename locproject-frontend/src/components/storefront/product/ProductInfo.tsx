import { ProductDetail } from '../../../types/api.types';
import ProductDetailClient from './ProductDetailClient';

interface ProductInfoProps {
    product: ProductDetail;
}

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + ' đ';
}

export default function ProductInfo({ product }: ProductInfoProps) {
    // Pre-compute first variant price for SSR render
    const firstVariant = product.variants[0];
    const discountPercent = firstVariant?.compareAtPrice
        ? Math.round((1 - firstVariant.price / firstVariant.compareAtPrice) * 100)
        : 0;
    const savings = firstVariant?.compareAtPrice
        ? firstVariant.compareAtPrice - firstVariant.price
        : 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Category + Title + Rating (static) */}
            <div>
                <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full font-label-bold text-label-bold mb-3">
                    {product.category.name}
                </span>
                <h1 data-testid="product-detail-name" className="font-headline-lg text-headline-lg text-primary font-bold mb-2">
                    {product.name}
                </h1>
                <div className="flex items-center gap-4 text-body-sm">
                    <div className="flex items-center gap-1 text-secondary">
                        <div className="flex">
                            {[1, 2, 3, 4].map((star) => (
                                <span key={star} className="material-symbols-outlined filled-icon text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            ))}
                            <span className="material-symbols-outlined text-[18px]">star_half</span>
                        </div>
                        <span className="font-bold">{product.rating}</span>
                    </div>
                    <span className="text-outline">|</span>
                    <span className="text-outline">{product.reviewCount} đánh giá</span>
                    <span className="text-outline">|</span>
                    <span className="text-outline">Đã bán {product.soldCount}</span>
                </div>
            </div>

            {/* Price Box (static) */}
            <div className="p-6 bg-surface-container-low rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <span className="text-primary font-bold text-[32px]">
                        {formatPrice(firstVariant?.price || 0)}
                    </span>
                    {firstVariant?.compareAtPrice && (
                        <>
                            <span className="text-outline line-through text-body-lg">
                                {formatPrice(firstVariant.compareAtPrice)}
                            </span>
                            <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold text-body-sm">
                                -{discountPercent}%
                            </span>
                        </>
                    )}
                </div>
                {savings > 0 && (
                    <p className="text-success-leaf font-label-bold text-label-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                        Tiết kiệm {formatPrice(savings)} cho mỗi sản phẩm
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

            {/* Share + Wishlist (static) */}
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
                    </div>
                </div>
                <button type="button" className="flex items-center gap-2 text-primary font-label-bold hover:underline">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    Lưu vào yêu thích
                </button>
            </div>
        </div>
    );
}