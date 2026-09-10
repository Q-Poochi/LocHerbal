import type { MetadataRoute } from 'next';
import { SITE_URL, API_URL } from '../lib/seo';

// Cache sitemap 1 giờ — dữ liệu lấy THẬT từ API (không hardcode).
export const revalidate = 3600;

type Row = { slug?: string; id?: string; updatedAt?: string };
type ListBody = { data?: Row[]; totalPages?: number } | Row[];

const now = new Date(); // chỉ dùng cho trang không có updatedAt trong DB

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Lấy TẤT CẢ sản phẩm (phân trang tới hết, không giới hạn 1 trang). */
async function fetchAllProducts(): Promise<Row[]> {
  const out: Row[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const body = await fetchJson<ListBody>(`/products?page=${page}&limit=100&sort=newest`);
    if (!body) break;
    const rows = Array.isArray(body) ? body : body.data ?? [];
    out.push(...rows);
    totalPages = Array.isArray(body) ? 1 : body.totalPages ?? 1;
    page++;
  } while (page <= totalPages && page <= 20); // giới hạn an toàn 2000 SP
  return out;
}

async function fetchCategories(): Promise<Row[]> {
  const body = await fetchJson<Row[] | { data?: Row[] }>('/categories');
  if (!body) return [];
  return Array.isArray(body) ? body : body.data ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Trang tĩnh (tương ứng route thật của storefront)
  entries.push({ url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 });
  entries.push({ url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 });
  entries.push({ url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.6 });
  for (const path of ['/ve-chung-toi', '/tu-van', '/lien-he', '/uu-dai']) {
    entries.push({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 });
  }

  // Category → /products?categoryId=<id> (URL lọc thực tế đang dùng)
  // Blog post CHƯA đưa vào sitemap: storefront chưa có trang /blog/[slug]
  // (card bài viết hiện không có link chi tiết) — thêm khi tạo trang chi tiết.
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchCategories()]);
  for (const cat of categories) {
    if (!cat.id) continue;
    entries.push({
      url: `${SITE_URL}/products?categoryId=${cat.id}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Chi tiết sản phẩm — lastModified dùng updatedAt thật từ DB
  for (const p of products) {
    if (!p.slug) continue;
    entries.push({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}