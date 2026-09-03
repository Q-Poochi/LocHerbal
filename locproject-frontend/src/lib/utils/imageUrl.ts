import type { CartItem } from '@/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ImageSource = Partial<Pick<CartItem, 'thumbnailUrl' | 'thumbnail' | 'variant' | 'product'>>;

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Ảnh placeholder seed-data (placehold.co, nền xanh đậm) — coi như chưa có
  // ảnh thật để UI render nền botanical dự phòng thay vì khối xanh đậm.
  if (trimmed.includes('placehold.co')) return '';

  // Legacy data: ảnh từng được lưu với port frontend cũ (3000) hoặc API cục bộ
  // (4000) — sửa host về backend hiện tại
  if (trimmed.includes('localhost:3000') || trimmed.includes('localhost:4000')) {
    return trimmed.replace(/localhost:(3000|4000)/, new URL(API_URL).host);
  }

  // Đường dẫn tương đối (/uploads/...) — ghép base API
  if (trimmed.startsWith('/')) {
    return `${API_URL.replace(/\/$/, '')}${trimmed}`;
  }

  return trimmed;
}

export function resolveCartItemImage(item: ImageSource | null | undefined): string {
  if (!item) return '';
  const img = item?.product?.product?.images?.[0];
  const variantImg = item?.variant?.product?.images?.[0];
  const url =
    item?.variant?.product?.thumbnailUrl ||
    item?.thumbnailUrl ||
    item?.thumbnail ||
    (typeof variantImg === 'string' ? variantImg : variantImg?.url) ||
    (typeof img === 'string' ? img : img?.url) ||
    '';
  return resolveImageUrl(url);
}
