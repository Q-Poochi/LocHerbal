'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useAddToCart, AuthRequiredError } from '../../lib/hooks/useProducts';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import Pagination from './Pagination';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '../../lib/providers/toast-provider';
import { useCartStore } from '../../lib/store/cart.store';
import { resolveImageUrl } from '../../lib/utils/imageUrl';
import type { Product } from '@/types/api.types';

type BtnState = 'idle' | 'loading' | 'success' | 'error';

function PLPProductCard({ product, highlightQuery }: { product: Product; highlightQuery: string }) {
  const [btnState, setBtnState] = useState<BtnState>('idle');
  const addToCartMutation = useAddToCart();
  const toast = useToast();
  const openDrawer = useCartStore((s) => s.openDrawer);

  const price = Number(product.variants?.[0]?.price ?? 0);
  const compareAt = Number(product.variants?.[0]?.compareAtPrice ?? 0);
  const hasDiscount = compareAt > price;
  const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (btnState !== 'idle') return;
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      toast.error('Sản phẩm không có biến thể');
      return;
    }
    setBtnState('loading');
    try {
      await addToCartMutation.mutateAsync({ productVariantId: variantId, qty: 1 });
      setBtnState('success');
      openDrawer();
      setTimeout(() => setBtnState('idle'), 1500);
    } catch (err) {
      if (err instanceof AuthRequiredError) return;
      setBtnState('error');
      toast.error('Thêm sản phẩm thất bại');
      setTimeout(() => setBtnState('idle'), 1500);
    }
  };

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary-100 text-primary-800 rounded px-0.5 not-italic">$1</mark>');
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      data-testid={`product-card-link-${product.slug}`}
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
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
          {product.seq === 1 && (
            <span className="bg-accent-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Bán chạy
            </span>
          )}
        </div>

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            type="button"
            data-testid={`add-to-cart-btn-${product.slug}`}
            onClick={handleAddToCart}
            className={`w-full py-3 flex items-center justify-center gap-2 font-semibold text-xs transition-all
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
            {btnState === 'success' && <span className="material-symbols-outlined text-sm">check_circle</span>}
            {btnState === 'error' && <span className="material-symbols-outlined text-sm">error</span>}
            {btnState === 'idle' && <span className="material-symbols-outlined text-sm">add_shopping_cart</span>}
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
              className={`material-symbols-outlined text-xs ${s <= 4 ? 'text-accent-gold' : 'text-gray-200'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >star</span>
          ))}
          <span className="text-[10px] text-text-secondary ml-1">(24)</span>
        </div>

        <h3
          className="font-display font-semibold text-sm text-text-primary line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors h-10"
          dangerouslySetInnerHTML={{ __html: highlight(product.name, highlightQuery) }}
        />

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-sm text-primary-700">
            {price.toLocaleString('vi-VN')}đ
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-text-tertiary line-through">
              {compareAt.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get('search') || '';

  const params = {
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as 'popular' | 'price_asc' | 'price_desc' | 'newest') || 'popular',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 25, /* 25 items per page */
    search: searchQuery || undefined,
  };

  const { data: response, isLoading, error } = useProducts(params);
  const products = response?.data ?? [];
  const totalPages = response?.totalPages ?? 1;

  if (isLoading) {
    return <ProductCardSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-2xl border border-border">
        <span className="material-symbols-outlined text-[48px] text-error mb-4">cloud_off</span>
        <h3 className="font-display font-bold text-lg text-text-primary mb-2">Không thể tải sản phẩm</h3>
        <p className="text-sm text-text-secondary mb-6">
          {(error as Error).message || 'Đã xảy ra lỗi kết nối mạng. Vui lòng tải lại trang.'}
        </p>
        <button
          onClick={() => router.refresh()}
          className="px-6 py-2.5 rounded-full bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  /* When search query is entered and returns 0 results */
  if (products.length === 0 && searchQuery) {
    return (
      <div className="space-y-12 animate-fade-in">
        {/* Fallback search error state */}
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
          <p className="text-text-primary font-medium mt-4">Không tìm thấy sản phẩm cho từ khóa &ldquo;{searchQuery}&rdquo;</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-text-secondary">Gợi ý tìm kiếm phổ biến:</span>
            {['Tim Mạch', 'Xương Khớp', 'Tiêu Hóa', 'An Thần'].map(suggestion => (
              <Link
                key={suggestion}
                href={`/products?search=${encodeURIComponent(suggestion)}`}
                className="text-sm text-primary-700 hover:underline font-semibold"
              >
                {suggestion}
              </Link>
            ))}
          </div>
        </div>

        {/* Suggest popular bestseller products as fallback */}
        <BestsellerSuggestions />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-10 text-center animate-fade-in">
        <span className="material-symbols-outlined text-5xl text-gray-300">inventory_2</span>
        <p className="text-text-secondary mt-4">Không có sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary-700 text-white rounded-full text-sm font-medium hover:bg-primary-800 transition-all"
        >
          Xóa tất cả bộ lọc
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Search results banner if searching */}
      {searchQuery && (
        <p className="text-sm text-text-secondary mb-4">
          Kết quả cho &ldquo;<strong>{searchQuery}</strong>&rdquo;: {response?.totalCount ?? products.length} sản phẩm
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {products.map((product: Product) => (
          <PLPProductCard key={product.id} product={product} highlightQuery={searchQuery} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination totalPages={totalPages} />
    </div>
  );
}

/* Fallback bestseller suggestions component when search result is empty */
function BestsellerSuggestions() {
  const { data } = useProducts({ limit: 4, sort: 'popular' });
  const items = data?.data ?? [];

  if (!items.length) return null;

  return (
    <div className="space-y-6 pt-6 border-t border-border">
      <h3 className="font-display font-bold text-xl text-primary-700">Có thể bạn quan tâm</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((product: Product) => (
          <PLPProductCard key={product.id} product={product} highlightQuery="" />
        ))}
      </div>
    </div>
  );
}
