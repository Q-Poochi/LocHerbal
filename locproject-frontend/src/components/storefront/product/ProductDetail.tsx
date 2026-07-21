import { ProductDetail as ProductDetailType } from '../../../types/api.types';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import ProductTabs from './ProductTabs';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';

async function getProduct(slug: string): Promise<ProductDetailType | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/products/slug/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export default async function ProductDetail({ slug }: { slug: string }) {
    const product = await getProduct(slug);

    if (!product) {
        return (
            <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
                    <h1 className="font-headline-md text-headline-md text-primary mb-2">Không tìm thấy sản phẩm</h1>
                    <p className="text-body-sm text-on-surface-variant">Sản phẩm này có thể đã ngừng bán hoặc không tồn tại.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 mb-6 text-outline font-label-bold text-label-bold">
                <a href="/" className="hover:text-primary transition-colors">
                    Trang chủ
                </a>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <a href="/products" className="hover:text-primary transition-colors">
                    Sản phẩm
                </a>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-on-surface">{product.category.name}</span>
            </nav>

            {/* Product Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                {/* Left Column: Gallery */}
                <ProductGallery images={product.images} categoryName={product.category.name} />

                {/* Right Column: Info & Actions */}
                <ProductInfo product={product} />
            </div>

            {/* Tabs Section */}
            <ProductTabs product={product} />

            {/* Review Section */}
            <ProductReviews />

            {/* Related Products */}
            <RelatedProducts />
        </main>
    );
}