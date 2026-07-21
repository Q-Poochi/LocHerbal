'use client';

import { useSearchParams } from 'next/navigation';
import { useProducts } from '../../lib/hooks/useProducts';
import ProductGridDisplay from './ProductGridDisplay';

export default function ProductGrid() {
  const searchParams = useSearchParams();

  const params = {
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as 'popular' | 'price_asc' | 'price_desc' | 'newest') || 'popular',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
    search: searchParams.get('search') || undefined,
  };

  console.log('[ProductGrid] Current filters:', { categoryId: params.categoryId, minPrice: params.minPrice, maxPrice: params.maxPrice });
  const { data: products = [], isLoading, error } = useProducts(params);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface-white rounded-xl shadow-soft overflow-hidden animate-pulse">
            <div className="aspect-square bg-surface-container" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-surface-container rounded w-3/4" />
              <div className="h-6 bg-surface-container rounded w-1/2" />
              <div className="h-10 bg-surface-container rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">Không thể tải sản phẩm</h3>
        <p className="text-body-sm text-on-surface-variant mb-6">
          {(error as Error).message || 'Vui lòng thử lại sau.'}
        </p>
      </div>
    );
  }

  return <ProductGridDisplay products={products} />;
}
