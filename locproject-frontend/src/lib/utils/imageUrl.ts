import type { CartItem } from '@/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ImageSource = Partial<Pick<CartItem, 'thumbnailUrl' | 'thumbnail' | 'variant' | 'product'>>;

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Legacy data: ảnh từng được lưu với port frontend cũ (3000) — sửa về backend
  if (trimmed.includes('localhost:3000')) {
    return trimmed.replace('localhost:3000', new URL(API_URL).host);
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
