import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface AdminBanner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    sortOrder: number;
    isActive: boolean;
}

export interface AdminBlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    thumbnailUrl?: string;
    authorId: string;
    author?: { id: string; fullName: string };
    status: string;
    publishedAt?: string;
    createdAt: string;
}

export interface AdminCoupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minOrderValue: number;
    usageLimit?: number;
    usedCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    campaignId?: string;
}

export function useAdminBanners() {
    return useQuery({
        queryKey: ['admin-banners'],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminBanner[]>('/marketing/banners');
            return data;
        },
    });
}

export function useAdminBlogPosts() {
    return useQuery({
        queryKey: ['admin-blog-posts'],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminBlogPost[]>('/marketing/blog-posts');
            return data;
        },
    });
}

export function useAdminCoupons() {
    return useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const { data } = await apiClient.get<Array<AdminCoupon & { _count?: { usages: number } }>>('/marketing/coupons');
            return data.map((c) => ({
                ...c,
                usedCount: c._count?.usages ?? 0,
            }));
        },
    });
}

export interface CreateBannerPayload {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    sortOrder?: number;
    isActive?: boolean;
}

export function useCreateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateBannerPayload) => {
            const { data } = await apiClient.post('/marketing/banners', payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
    });
}

export function useUpdateBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateBannerPayload> }) => {
            const { data } = await apiClient.patch(`/marketing/banners/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
    });
}

export function useDeleteBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/marketing/banners/${id}`);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
    });
}

export interface CreateBlogPostPayload {
    title: string;
    slug: string;
    content: string;
    thumbnailUrl?: string;
    authorId: string;
    status?: string;
    publishedAt?: string;
}

export function useCreateBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateBlogPostPayload) => {
            const { data } = await apiClient.post('/marketing/blog-posts', payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog-posts'] }),
    });
}

export function useUpdateBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateBlogPostPayload> }) => {
            const { data } = await apiClient.patch(`/marketing/blog-posts/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog-posts'] }),
    });
}

export function useDeleteBlogPost() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/marketing/blog-posts/${id}`);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog-posts'] }),
    });
}

export interface CouponPayload {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minOrderValue?: number;
    usageLimit?: number;
    startDate: string;
    endDate: string;
    campaignId?: string;
    isActive?: boolean;
}

export function useCreateCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CouponPayload) => {
            const { data } = await apiClient.post('/marketing/coupons', payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
    });
}

export function useUpdateCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<CouponPayload> }) => {
            const { data } = await apiClient.patch(`/marketing/coupons/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
    });
}

export function useDeleteCoupon() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/marketing/coupons/${id}`);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
    });
}

// ── Storefront public ────────────────────────────────────────────────────
export interface StorefrontBanner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
    position: string;
    sortOrder: number;
    isActive: boolean;
}

// ⚠️ HERO BANNER — CHỈ 1 object (hoặc null), KHÔNG PHẢI mảng.
export interface StorefrontHeroBanner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl?: string;
    isActive: boolean;
}

// ⚠️ CHỈ dùng cho HeroSection — GET /hero-banner (1 object, không mảng).
export function useHeroBanner() {
    return useQuery({
        queryKey: ['hero-banner'],
        queryFn: async () => {
            const { data } = await apiClient.get<StorefrontHeroBanner | null>('/hero-banner');
            return data ?? null;
        },
        staleTime: 60000,
    });
}

// ⚠️ CHỈ dùng cho AdminHeroBanner — set/update hero banner (PUT /admin/hero-banner).
export function useUpsertHeroBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { title: string; imageUrl: string; linkUrl?: string; isActive?: boolean }) => {
            const { data } = await apiClient.put('/admin/hero-banner', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hero-banner'] });
            qc.invalidateQueries({ queryKey: ['admin-banners'] });
        },
    });
}

// ⚠️ CHỈ dùng cho AdminHeroBanner — xoá hero banner (DELETE /admin/hero-banner).
export function useDeleteHeroBanner() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.delete('/admin/hero-banner');
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hero-banner'] });
            qc.invalidateQueries({ queryKey: ['admin-banners'] });
        },
    });
}

export interface StorefrontBlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    thumbnailUrl?: string;
    author?: { id: string; fullName: string } | null;
    status: string;
    publishedAt?: string;
}

export function usePublicBlogPosts() {
    return useQuery({
        queryKey: ['public-blog-posts'],
        queryFn: async () => {
            const { data } = await apiClient.get<StorefrontBlogPost[]>('/public/marketing/blog-posts');
            return data;
        },
        staleTime: 60000,
    });
}

// ── Page Builder ────────────────────────────────────────────────────────
export type PageBlockType = 'hero' | 'text' | 'image-text' | 'stats' | 'team' | 'timeline';

export interface AdminPageBlock {
    id: string;
    page: string;
    type: PageBlockType;
    order: number;
    content: Record<string, unknown>;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

export const PAGE_BLOCK_TYPE_LABELS: Record<PageBlockType, string> = {
    hero: 'Hero (ảnh nền + tiêu đề)',
    text: 'Văn bản',
    'image-text': 'Ảnh + văn bản',
    stats: 'Số liệu thống kê',
    team: 'Đội ngũ',
    timeline: 'Mốc phát triển',
};

export function useAdminPageBlocks(pageSlug: string) {
    return useQuery({
        queryKey: ['admin-page-blocks', pageSlug],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminPageBlock[]>(`/admin/pages/${pageSlug}/blocks`);
            return data;
        },
    });
}

export function useCreatePageBlock(pageSlug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { type: PageBlockType; content?: Record<string, unknown> }) => {
            const { data } = await apiClient.post(`/admin/pages/${pageSlug}/blocks`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-page-blocks', pageSlug] }),
    });
}

export function useUpdatePageBlock(pageSlug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: { content?: Record<string, unknown>; isPublished?: boolean } }) => {
            const { data } = await apiClient.patch(`/admin/pages/${pageSlug}/blocks/${id}`, payload);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-page-blocks', pageSlug] }),
    });
}

export function useReorderPageBlocks(pageSlug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (items: { id: string; order: number }[]) => {
            const { data } = await apiClient.patch(`/admin/pages/${pageSlug}/blocks/reorder`, { items });
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-page-blocks', pageSlug] }),
    });
}

export function useDeletePageBlock(pageSlug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/admin/pages/${pageSlug}/blocks/${id}`);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-page-blocks', pageSlug] }),
    });
}