'use client';

import { useAuthStore } from '../store/auth.store';

/**
 * Đảm bảo phiên được khôi phục ĐÚNG 1 LẦN duy nhất mỗi lần load trang.
 *
 * Vì sao cần single-flight: backend áp refresh-token rotation nghiêm ngặt —
 * gọi POST /auth/refresh đồng thời 2 lần với cùng cookie → lần 2 bị coi là
 * replay attack → revoke TOÀN BỘ phiên của user. Nhiều component (AuthBootstrap,
 * AdminSessionGate, trang bảo vệ...) đều cần chờ phiên khôi phục, nên phải
 * chia sẻ CÙNG một promise.
 */
let inflight: Promise<boolean> | null = null;

export function ensureSessionRestored(): Promise<boolean> {
    // Đã có token trong RAM (SPA login vừa xong) → không cần refresh
    const { accessToken } = useAuthStore.getState();
    if (accessToken) return Promise.resolve(true);

    if (!inflight) {
        inflight = useAuthStore
            .getState()
            .refreshSession()
            .finally(() => {
                inflight = null;
            });
    }
    return inflight;
}
