// ── Shared SEO helpers — domain + dữ liệu công ty cho robots/sitemap/JSON-LD ──
// Domain: Railway subdomain hiện tại (chưa có domain riêng — xác nhận 06/09/2026).
// Khi mua domain: chỉ cần set biến môi trường NEXT_PUBLIC_SITE_URL, mọi nơi
// (robots.ts, sitemap.ts, canonical, openGraph, JSON-LD) tự cập nhật.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://frontend-production-d58e.up.railway.app'
).replace(/\/+$/, '');

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface CompanyInfo {
  companyName: string;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  zaloUrl?: string | null;
}

/** Fetch company settings (endpoint public — backend đã tự cache 1 giờ). */
export async function getCompany(): Promise<CompanyInfo> {
  const fallback: CompanyInfo = { companyName: 'LocHerbal' };
  try {
    const res = await fetch(`${API_URL}/settings/company`, { next: { revalidate: 3600 } });
    if (!res.ok) return fallback;
    const body = (await res.json()) as CompanyInfo | { data?: CompanyInfo };
    const data = (body as { data?: CompanyInfo }).data ?? (body as CompanyInfo);
    return { ...fallback, ...data };
  } catch {
    return fallback;
  }
}