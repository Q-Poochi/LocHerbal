import type { Metadata } from 'next';
import Navbar from '../../../../components/storefront/layout/Navbar';
import Footer from '../../../../components/storefront/layout/Footer';
import ProductDetail, { getProduct } from '../../../../components/storefront/product/ProductDetail';
import { getVariantPricing } from '../../../../lib/utils/discount';
import { resolveImageUrl } from '../../../../lib/utils/imageUrl';
import { SITE_URL } from '../../../../lib/seo';

function buildDescription(name: string, description: string | undefined): string {
  return (
    (description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `${name} - sản phẩm thảo dược thiên nhiên chính hãng tại LocHerbal`
  );
}

// Metadata riêng cho TỪNG sản phẩm (trước đây mọi trang dùng chung title tĩnh).
// Dùng chung getProduct với page component — Next.js dedupe fetch cùng request.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: 'Sản phẩm | LocHerbal' };
  }

  const description = buildDescription(product.name, product.description);
  const image = resolveImageUrl(product.thumbnailUrl ?? product.images?.[0]?.url);

  return {
    title: `${product.name} | LocHerbal`,
    description,
    alternates: { canonical: `${SITE_URL}/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const product = await getProduct(slug);
    const pricing = product ? getVariantPricing(product.variants[0]) : null;

    // JSON-LD Product schema — chỉ thêm aggregateRating khi CÓ review thật
    // (quyết định Đợt 1: không hiện rating giả khi chưa có đánh giá).
    const jsonLd =
        product && pricing
            ? {
                  '@context': 'https://schema.org',
                  '@type': 'Product',
                  name: product.name,
                  ...(resolveImageUrl(product.thumbnailUrl ?? product.images?.[0]?.url)
                      ? { image: resolveImageUrl(product.thumbnailUrl ?? product.images?.[0]?.url) }
                      : {}),
                  description: buildDescription(product.name, product.description).slice(0, 300),
                  offers: {
                      '@type': 'Offer',
                      priceCurrency: 'VND',
                      price: pricing.price,
                      availability: 'https://schema.org/InStock',
                      url: `${SITE_URL}/products/${product.slug}`,
                  },
                  ...(product.reviewCount && product.reviewCount > 0 && product.rating
                      ? {
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: product.rating,
                                reviewCount: product.reviewCount,
                            },
                        }
                      : {}),
              }
            : null;

    return (
        <>
            <Navbar />
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductDetail slug={slug} />
            <Footer />
        </>
    );
}
