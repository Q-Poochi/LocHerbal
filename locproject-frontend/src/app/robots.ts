import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

// robots.txt — sinh động bởi Next.js App Router (trước đây 404).
// Private areas: chặn index các trang cần đăng nhập/transactional.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/checkout', '/cart'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}