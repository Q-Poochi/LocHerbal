'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';

/**
 * Khôi phục phiên khi app khởi động:
 * - accessToken KHÔNG persist (chỉ nằm trong RAM) theo quyết định bảo mật.
 * - Khi reload, refresh token (httpOnly cookie) tự động gửi kèm POST /auth/refresh
 *   để lấy accessToken mới. Nếu cookie hết hạn → coi như chưa đăng nhập.
 */
export function AuthBootstrap() {
    const accessToken = useAuthStore((s) => s.accessToken);

    // Chỉ gọi refreshSession 1 lần khi mount, không retry
    const triedRef = useRef(false);

    useEffect(() => {
        if (!accessToken && !triedRef.current) {
            triedRef.current = true;
            useAuthStore.getState().refreshSession();
        }
    }, [accessToken]);

    return null;
}
