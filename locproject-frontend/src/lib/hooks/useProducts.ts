import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, refreshAccessToken } from '../api/client';
import { ProductDetail, CartItem, Product, Category } from '../../types/api.types';
import { useAuthStore } from '../store/auth.store';
import { getSessionId } from '../session';
import { useToast } from '../providers/toast-provider';

/** Lỗi khi người dùng chưa đăng nhập mà thực hiện thao tác yêu cầu đăng nhập. */
export class AuthRequiredError extends Error {
  constructor() {
    super('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    this.name = 'AuthRequiredError';
  }
}

interface ProductsParams {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
    page?: number;
    limit?: number;
    search?: string;
}

interface ProductsResponse {
    data?: Product[];
    totalCount?: number;
    totalPages?: number;
}

export function useProducts(params: ProductsParams = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const { data } = await apiClient.get<ProductsResponse | Product[]>('/products', { params });
            return Array.isArray(data) ? { data } : data;
        },
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await apiClient.get<Category[] | { data?: Category[] }>('/categories');
            // Response có thể là array cũ (no pagination) hoặc { data, total } (có pagination)
            return Array.isArray(data) ? data : (data?.data ?? []);
        },
        staleTime: 60000,
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

/** Lấy chi tiết sản phẩm theo id (dùng cho admin edit form). Endpoint GET /products/:id là public. */
export function useProductById(id?: string) {
    return useQuery({
        queryKey: ['product', 'by-id', id],
        queryFn: async () => {
            const { data } = await apiClient.get<ProductDetail>(`/products/${id}`);
            return data;
        },
        enabled: !!id,
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
    const router = useRouter();
    const toast = useToast();
    return useMutation({
        mutationFn: async ({ productVariantId, qty }: { productVariantId: string; qty: number }) => {
            let token = useAuthStore.getState().accessToken;
            if (!token) {
                try {
                    const res = await refreshAccessToken();
                    token = res.accessToken;
                } catch {
                    toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                    throw new AuthRequiredError();
                }
            }
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
        queryFn: async ({ signal }) => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const params = guestParams();
            const query = new URLSearchParams(params as Record<string, string>).toString();
            const url = `${baseUrl}/cart${query ? `?${query}` : ''}`;
            console.log('Cart API URL:', url);
            const { data } = await apiClient.get('/cart', { params, signal, timeout: 15000 });
            console.log('RAW cart response:', JSON.stringify(data, null, 2));
            return data;
        },
        retry: 1,
        staleTime: 30000,
    });
}

/** Tổng số lượng item trong giỏ (dùng cho badge navbar). */
export function useCartCount(): number {
    const { data: cart } = useCart();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum: number, item: CartItem) => sum + item.qty, 0);
}

export interface CreateProductPayload {
    categoryId: string;
    name: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    isPublished?: boolean;
    images?: string[];
    variants?: {
        id?: string;
        sku: string;
        name?: string;
        price: number;
        compareAtPrice?: number;
        discountStartAt?: string;
        discountEndAt?: string;
    }[];
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateProductPayload) => {
            const { data } = await apiClient.post('/products', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useUpdateProduct(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<CreateProductPayload>) => {
            const { data } = await apiClient.put(`/products/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
        },
    });
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
    couponCode?: string;
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
