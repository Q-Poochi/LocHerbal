/**
 * Tính trạng thái giảm giá một cách ĐỘNG (theo thời điểm render) từ raw data
 * của variant. Không tin tưởng tuyệt đối isDiscountActive do backend cache
 * (findBySlug cache 15p) — đảm bảo khi discountEndAt qua đi, UI tự tắt
 * giảm giá ngay khi reload mà không cần admin sửa tay.
 */
export interface VariantPricingInput {
    price?: number | string;
    priceRaw?: number | string;
    compareAtPrice?: number | string | null;
    compareAtPriceRaw?: number | string | null;
    discountStartAt?: string | null;
    discountEndAt?: string | null;
    isDiscountActive?: boolean;
    discountPercent?: number | null;
}

export interface VariantPricing {
    isDiscountActive: boolean;
    discountPercent: number | null;
    price: number;
    compareAtPrice: number | null;
    discountEndAt: string | null;
}

export function getVariantPricing(v: VariantPricingInput | undefined | null): VariantPricing {
    const now = Date.now();

    const rawPrice = v?.priceRaw != null ? Number(v.priceRaw) : Number(v?.price ?? 0);
    const rawCompare =
        v?.compareAtPriceRaw != null
            ? Number(v.compareAtPriceRaw)
            : v?.compareAtPrice != null
            ? Number(v.compareAtPrice)
            : null;

    const startAt = v?.discountStartAt ? new Date(v.discountStartAt).getTime() : null;
    const endAt = v?.discountEndAt ? new Date(v.discountEndAt).getTime() : null;

    const active =
        rawCompare !== null &&
        rawCompare > rawPrice &&
        (startAt === null || now >= startAt) &&
        (endAt === null || now <= endAt);

    const discountPercent = active && rawCompare
        ? Math.round(((rawCompare - rawPrice) / rawCompare) * 100)
        : null;

    return {
        isDiscountActive: active,
        discountPercent,
        price: active ? rawPrice : (rawCompare ?? rawPrice),
        compareAtPrice: active ? rawCompare : null,
        discountEndAt: v?.discountEndAt ?? null,
    };
}

/** Format "Kết thúc sau: X ngày Y giờ" từ discountEndAt (so với hiện tại). */
export function formatDiscountDeadline(endAt: string | null): string | null {
    if (!endAt) return null;
    const end = new Date(endAt).getTime();
    const diffMs = end - Date.now();
    if (diffMs <= 0) return null;

    const totalHours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

    if (days > 0) return `Kết thúc sau: ${days} ngày ${hours} giờ`;
    if (hours > 0) return `Kết thúc sau: ${hours} giờ ${minutes} phút`;
    return `Kết thúc sau: ${minutes} phút`;
}