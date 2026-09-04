import { useAuthStore } from '@/lib/store/auth.store';

/**
 * Bust Data Cache của Next.js cho storefront (best-effort, fire-and-forget).
 *
 * Gọi POST /api/revalidate — route handler chạy trên frontend server,
 * tự xác thực admin bằng JWT (forward lên backend /auth/me) rồi gọi
 * revalidateTag(). Nếu thất bại (mất token, network...), cache vẫn tự
 * hết stale sau tối đa 60 giây nhờ `revalidate: 60` ở các fetch.
 *
 * CHỈ gọi sau các mutation admin (lưu/xuất bản sản phẩm).
 */
export async function revalidateStorefront(tags: string[]): Promise<void> {
    try {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) return;

        await fetch('/api/revalidate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ tags }),
            keepalive: true,
        });
    } catch {
        // Best-effort — không bao giờ làm fail flow lưu sản phẩm.
    }
}