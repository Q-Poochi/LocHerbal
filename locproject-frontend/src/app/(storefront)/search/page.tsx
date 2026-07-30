'use client';

import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/lib/hooks/useProducts';
import ProductGridDisplay from '@/components/storefront/ProductGridDisplay';
import { ProductCardSkeleton } from '@/components/storefront/ProductCardSkeleton';
import EmptyState from '@/components/storefront/EmptyState';
import Link from 'next/link';
import { Suspense } from 'react';

export default function SearchPage() {
    return (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Tìm kiếm sản phẩm</h1>
            <Suspense fallback={<ProductCardSkeleton count={4} />}>
                <SearchContent />
            </Suspense>
        </div>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';

    const params = {
        search: q || undefined,
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        limit: 12,
    };

    const { data: response, isLoading, error } = useProducts(params);
    const products = response?.data ?? [];
    const totalPages = response?.totalPages ?? 1;

    if (isLoading) {
        return <ProductCardSkeleton count={8} />;
    }

    if (error) {
        return (
            <EmptyState
                icon="cloud_off"
                title="Không thể tải kết quả"
                description="Có lỗi xảy ra, vui lòng thử lại."
                action={
                    <button onClick={() => window.location.reload()}
                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-bold hover:opacity-90 transition-all">
                        Tải lại
                    </button>
                }
            />
        );
    }

    if (!products.length) {
        return (
            <EmptyState
                icon="search_off"
                title="Không tìm thấy sản phẩm phù hợp"
                description={q ? `Không có kết quả cho "${q}". Thử tìm với từ khóa khác nhé!` : 'Hãy nhập từ khóa để tìm kiếm sản phẩm'}
                action={
                    <Link href="/products" className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-bold hover:opacity-90 transition-all">
                        Xem tất cả sản phẩm
                    </Link>
                }
            />
        );
    }

    return (
        <>
            <p className="text-body-sm text-on-surface-variant mb-8">
                {q ? `Kết quả tìm kiếm cho "${q}"` : 'Tất cả sản phẩm'}
            </p>
            <ProductGridDisplay products={products} />
        </>
    );
}
