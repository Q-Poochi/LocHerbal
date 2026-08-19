'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useAddToCart, AuthRequiredError } from '../../../lib/hooks/useProducts';
import { useCartStore } from '../../../lib/store/cart.store';
import { resolveImageUrl } from '../../../lib/utils/imageUrl';
import { getVariantPricing } from '../../../lib/utils/discount';
import type { Product } from '@/types/api.types';

type BtnState = 'idle' | 'loading' | 'success' | 'error';

function ProductCard({ product }: { product: Product }) {
  const [btnState, setBtnState] = useState<BtnState>('idle');
  const addToCartMutation = useAddToCart();
  const { openDrawer } = useCartStore();

  const pricing = getVariantPricing(product.variants?.[0]);
  const price = pricing.price;
  const compareAt = pricing.compareAtPrice ?? 0;
  const hasDiscount = pricing.isDiscountActive;
  const discountPct = pricing.discountPercent ?? 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (btnState !== 'idle') return;
    const variantId = product.variants?.[0]?.id;
    if (!variantId) return;
    setBtnState('loading');
    try {
      await addToCartMutation.mutateAsync({ productVariantId: variantId, qty: 1 });
      setBtnState('success');
      openDrawer();
      setTimeout(() => setBtnState('idle'), 1500);
    } catch (err) {
      if (err instanceof AuthRequiredError) return;
      setBtnState('error');
      setTimeout(() => setBtnState('idle'), 1500);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg
                 border border-border hover:border-primary-200 transition-all duration-300 block"
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        {resolveImageUrl(product.thumbnailUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(product.thumbnailUrl)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary-200 group-hover:scale-105 transition-transform duration-400"
              style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}
            >
              local_pharmacy
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
          {product.seq === 1 && (
            <span className="bg-accent-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Bán chạy
            </span>
          )}
        </div>

        {/* Quick add — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-all
              ${btnState === 'success'
                ? 'bg-primary-500 text-white'
                : btnState === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-primary-700 text-white hover:bg-primary-800'
              }`}
          >
            {btnState === 'loading' && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {btnState === 'success' && <span className="material-symbols-outlined text-base">check_circle</span>}
            {btnState === 'error' && <span className="material-symbols-outlined text-base">error</span>}
            {btnState === 'idle' && <span className="material-symbols-outlined text-base">add_shopping_cart</span>}
            {btnState === 'idle' && 'Thêm vào giỏ'}
            {btnState === 'loading' && 'Đang thêm...'}
            {btnState === 'success' && 'Đã thêm!'}
            {btnState === 'error' && 'Thử lại'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <span
              key={s}
              className={`material-symbols-outlined text-sm ${s <= 4 ? 'text-accent-gold' : 'text-gray-200'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >star</span>
          ))}
          <span className="text-xs text-text-secondary ml-1">(24)</span>
        </div>

        <h3 className="font-display font-semibold text-base text-text-primary line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-lg text-primary-700">
            {price.toLocaleString('vi-VN')}đ
          </span>
          {hasDiscount && (
            <span className="text-sm text-text-tertiary line-through">
              {compareAt.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border animate-pulse">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function FeaturedProducts({
  products,
  loadState,
  onRetry,
}: {
  products: Product[];
  loadState: 'loading' | 'success' | 'error';
  onRetry: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const visibleCount = 4; // desktop shows 4
  const maxIdx = Math.max(0, products.length - visibleCount);

  const scrollTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, maxIdx));
    setActiveIdx(clamped);
    if (trackRef.current) {
      const cardWidth = trackRef.current.children[0]?.getBoundingClientRect().width ?? 0;
      const gap = 24;
      trackRef.current.style.transform = `translateX(-${clamped * (cardWidth + gap)}px)`;
    }
  };

  return (
    <section className="w-full py-16 md:py-20 bg-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-gold-pale text-accent-gold text-sm font-medium mb-4">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Nổi bật
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary tracking-tight">
              Sản Phẩm Nổi Bật
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-1 text-primary-700 font-medium hover:underline text-sm"
          >
            Xem tất cả
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>
        </div>

        {/* Loading */}
        {loadState === 'loading' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error — không im lặng hiện trang trống, đưa nút thử lại */}
        {loadState === 'error' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
            <p className="text-text-secondary max-w-md">
              Không thể tải sản phẩm lúc này. Có thể máy chủ đang khởi động lại — vui lòng thử lại sau giây lát.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-700 text-white font-medium text-sm hover:bg-primary-800 transition-colors"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Thử lại
            </button>
          </div>
        )}

        {/* Carousel */}
        {loadState === 'success' && products.length > 0 && (
          <div className="relative">
            {/* Prev button */}
            <button
              type="button"
              onClick={() => scrollTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white
                          border border-border shadow-md flex items-center justify-center
                          hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-all duration-200
                          ${activeIdx === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>

            {/* Track container */}
            <div className="overflow-hidden">
              <div
                ref={trackRef}
                className="flex gap-6 transition-transform duration-400 ease-out"
                style={{ willChange: 'transform' }}
              >
                {products.map((p: Product) => (
                  <div key={p.id} className="flex-shrink-0 w-[calc(50%-12px)] md:w-[calc(25%-18px)]">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={() => scrollTo(activeIdx + 1)}
              disabled={activeIdx >= maxIdx}
              className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white
                          border border-border shadow-md flex items-center justify-center
                          hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-all duration-200
                          ${activeIdx >= maxIdx ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>

            {/* Dots */}
            {maxIdx > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: maxIdx + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Đến sản phẩm nổi bật ${i + 1}`}
                    onClick={() => scrollTo(i)}
                    className={`transition-all duration-300 rounded-full h-2
                      ${i === activeIdx ? 'w-6 bg-primary-700' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="flex justify-center mt-8 md:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary-700
                       text-primary-700 font-medium text-sm hover:bg-primary-50 transition-colors"
          >
            Xem tất cả sản phẩm
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </Link>
        </div>
      </div>
    </section>
  );
}