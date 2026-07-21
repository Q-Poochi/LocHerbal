import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Product, ProductDetail } from '../../types/api.types';
import { useAuthStore } from '../store/auth.store';
import { getSessionId } from '../session';

interface ProductsParams {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
    page?: number;
    limit?: number;
}

export function useProducts(params: ProductsParams = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const { data } = await apiClient.get<any>('/products', { params });
            return data.data ?? data;
        },
    });
}

export function useProduct(slug: string) {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const { data } = await apiClient.get<ProductDetail>(`/products/${slug}`);
            return data;
        },
        enabled: !!slug,
    });
}

// Auth header được gắn tự động bởi interceptor. Guest dùng sessionId query param.
function guestParams() {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) return {};
    return { sessionId: getSessionId() };
}

export function useAddToCart() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ productVariantId, qty }: { productVariantId: string; qty: number }) => {
            const { data } = await apiClient.post('/cart/items', { productVariantId, qty }, {
                params: guestParams(),
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}

export function useUpdateCartItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ variantId, qty }: { variantId: string; qty: number }) => {
            const { data } = await apiClient.patch(`/cart/items/${variantId}`, { qty }, {
                params: guestParams(),
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}

export function useRemoveFromCart() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variantId: string) => {
            const { data } = await apiClient.delete(`/cart/items/${variantId}`, {
                params: guestParams(),
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}

export function useCart() {
    return useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const params = guestParams();
            const query = new URLSearchParams(params as Record<string, string>).toString();
            const url = `${baseUrl}/cart${query ? `?${query}` : ''}`;
            console.log('Cart API URL:', url);
            const { data } = await apiClient.get('/cart', { params });
            console.log('RAW cart response:', JSON.stringify(data, null, 2));
            return data;
        },
    });
}

/** Tổng số lượng item trong giỏ (dùng cho badge navbar). */
export function useCartCount(): number {
    const { data: cart } = useCart();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum: number, item: any) => sum + item.qty, 0);
}

export interface CheckoutResult {
    orderId: string;
    orderCode: string;
    paymentUrl: string;
}

export interface CheckoutPayload {
    fullName: string;
    phone: string;
    email?: string;
    province: string;
    district: string;
    ward: string;
    address: string;
    note?: string;
    paymentMethod: 'vnpay' | 'momo' | 'cod';
}

/**
 * Checkout 2 bước:
 * 1. POST /cart/checkout (yêu cầu login) -> nhận Order { id, orderCode }
 * 2. GET /payment/vnpay-url?orderId=... -> nhận { url }
 * Trả về { orderId, orderCode, paymentUrl } để frontend redirect sang VNPay.
 */
export function useCheckout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CheckoutPayload): Promise<CheckoutResult> => {
            const { data: order } = await apiClient.post('/cart/checkout', payload);
            if (payload.paymentMethod === 'cod' || payload.paymentMethod === 'momo') {
                return {
                    orderId: order.id,
                    orderCode: order.orderCode,
                    paymentUrl: '',
                };
            }
            const { data: pay } = await apiClient.get('/payment/vnpay-url', {
                params: { orderId: order.id },
            });
            return {
                orderId: order.id,
                orderCode: order.orderCode,
                paymentUrl: pay.url,
            };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}
