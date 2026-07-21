import ProductGrid from '@/components/storefront/ProductGrid';
import { Suspense } from 'react';

export default function SearchPage() {
    return (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Tìm kiếm sản phẩm</h1>
            <p className="text-body-sm text-on-surface-variant mb-8">Kết quả tìm kiếm</p>
            <Suspense fallback={<div className="h-96 bg-surface-container-low animate-pulse rounded-lg" />}>
                <ProductGrid />
            </Suspense>
        </div>
    );
}