import { getCompany, SITE_URL } from '@/lib/seo';

// Layout server cho toàn bộ storefront — render Organization JSON-LD
// (schema.org) từ dữ liệu THẬT của CompanySettings. Không thay đổi UI.
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
      {children}
    </>
  );
}