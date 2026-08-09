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

export function usePublicBanners() {
    return useQuery({
        queryKey: ['public-banners'],
        queryFn: async () => {
            const { data } = await apiClient.get<StorefrontBanner[]>('/public/marketing/banners');
            return data;
        },
        staleTime: 60000,
    });
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