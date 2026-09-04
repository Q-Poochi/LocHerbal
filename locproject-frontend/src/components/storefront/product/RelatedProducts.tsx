import Link from 'next/link';
import Image from 'next/image';
import { ProductDetail } from '../../../types/api.types';
import { resolveImageUrl } from '../../../lib/utils/imageUrl';
import { getVariantPricing } from '../../../lib/utils/discount';

interface RelatedProduct {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
    category?: { name: string };
    variants?: {
        price: number;
        compareAtPrice?: number;
        priceRaw?: number;
        compareAtPriceRaw?: number;
        discountStartAt?: string;
        discountEndAt?: string;
        isDiscountActive?: boolean;
        discountPercent?: number;
    }[];
}

interface ProductsResponse {
    data?: RelatedProduct[];
    totalCount?: number;
}

async function getRelated(categoryId: string, limit = 4): Promise<RelatedProduct[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(
            `${baseUrl}/products?categoryId=${encodeURIComponent(categoryId)}&limit=${limit}&sort=popular`,
            { next: { revalidate: 60, tags: ['products'] } },
        );
        if (!res.ok) return [];
        const json: ProductsResponse = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
    } catch {
        return [];
    }
}

function formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
}

export default async function RelatedProducts({ product }: { product: ProductDetail }) {
    const related = (await getRelated(product.category.id)).filter((rp) => rp.id !== product.id);

    return (
        <section className="mb-16">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="font-display font-bold text-2xl text-text-primary">Sản phẩm liên quan</h2>
                    <p className="text-sm text-text-secondary mt-1">Có thể bạn cũng quan tâm đến các loại thảo dược khác</p>
                </div>
                <Link href="/products" className="text-primary-700 font-semibold text-sm flex items-center gap-1 hover:underline">
                    Xem tất cả
                    <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                </Link>
            </div>
            {related.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-[48px] text-text-tertiary mb-4">ecg_heart</span>
                    <p className="text-text-secondary font-medium">Chưa có sản phẩm liên quan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {related.map((rp) => {
                        const pricing = getVariantPricing(rp.variants?.[0]);
                        const price = pricing.price;
                        const compareAt = pricing.compareAtPrice ?? 0;
                        return (
                            <Link
                                key={rp.id}
                                href={`/products/${rp.slug}`}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:-translate-y-1 transition-all duration-200 block group"
                            >
                                <div className="aspect-square relative overflow-hidden bg-surface-alt">
                                    {resolveImageUrl(rp.thumbnailUrl) ? (
                                        <Image
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            src={resolveImageUrl(rp.thumbnailUrl)}
                                            alt={rp.name}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary-200 text-[56px]">local_pharmacy</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 md:p-4 space-y-1">
                                    <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">{rp.category?.name}</p>
                                    <h3 className="font-semibold text-sm md:text-base text-text-primary leading-tight line-clamp-2 min-h-[40px] md:min-h-[48px]">{rp.name}</h3>
                                    <div className="flex flex-wrap items-baseline gap-2 pt-1">
                                        {price > 0 && (
                                            <>
                                                <span className="text-primary-700 font-bold text-sm md:text-base">{formatPrice(price)}</span>
                                                {pricing.isDiscountActive && compareAt > price && (
                                                    <span className="text-xs text-text-tertiary line-through">{formatPrice(compareAt)}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
