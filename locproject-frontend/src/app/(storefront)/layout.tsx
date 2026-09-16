import { getCompany, SITE_URL } from '@/lib/seo';
import { SmoothScroll } from '@/components/ui/SmoothScroll';

// Layout server cho toàn bộ storefront:
// - render Organization JSON-LD (schema.org) từ dữ liệu THẬT của CompanySettings
// - bọc children trong SmoothScroll (client component) để có cuộn mượt Lenis
// Giữ nguyên server component để JSON-LD nằm trong HTML thô (SEO / pre-render).
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = await getCompany();
  const sameAs = [company.websiteUrl, company.facebookUrl, company.youtubeUrl, company.zaloUrl].filter(
    (u): u is string => Boolean(u),
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.companyName || 'LocHerbal',
    url: SITE_URL,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmoothScroll>{children}</SmoothScroll>
    </>
  );
}