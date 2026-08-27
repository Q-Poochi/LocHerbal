'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { ensureSessionRestored } from '../auth/session-restore';
import { apiClient } from '../api/client';

/**
 * Khôi phục phiên khi app khởi động:
 * - accessToken KHÔNG persist (chỉ nằm trong RAM) theo quyết định bảo mật.
 * - Khi reload, refresh token (httpOnly cookie) tự động gửi kèm POST /auth/refresh
 *   để lấy accessToken mới. Nếu cookie hết hạn → coi như chưa đăng nhập.
 * - Dùng ensureSessionRestored() (single-flight) để KHÔNG bao giờ gọi
 *   /auth/refresh trùng lặp cùng lúc với AdminSessionGate — tránh bị backend
 *   coi là replay attack và revoke toàn bộ phiên.
 * - Fetch CSRF token sớm (cross-origin cookie không đọc được qua document.cookie).
 */
export function AuthBootstrap() {
    const accessToken = useAuthStore((s) => s.accessToken);

    // Chỉ gọi refreshSession 1 lần khi mount, không retry
    const triedRef = useRef(false);

    useEffect(() => {
        if (!accessToken && !triedRef.current) {
            triedRef.current = true;
            ensureSessionRestored();
        }
    }, [accessToken]);

    // Fetch CSRF token ngay khi mount (non-blocking) để add-to-cart/checkout không bị 403
    useEffect(() => {
        if (typeof window !== 'undefined') {
            apiClient.get('/auth/csrf', { withCredentials: true }).catch(() => { /* ignore */ });
        }
    }, []);

    return null;
}
