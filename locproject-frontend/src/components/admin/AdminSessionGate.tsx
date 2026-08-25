'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ensureSessionRestored } from '@/lib/auth/session-restore';

type GateStatus = 'checking' | 'authed' | 'anonymous';

/**
 * Cổng bảo vệ cho toàn bộ khu vực /admin:
 * - Hard-reload làm mất accessToken trong RAM → các fetch dữ liệu bắn ra
 *   TRƯỚC khi refreshSession kịp hoàn tất sẽ dính 401 → trang dashboard
 *   crash vào error boundary (bug phát hiện qua beta test).
 * - Gate này CHỜ phiên khôi phục xong mới render children; nếu không có
 *   phiên → hiện thông báo + link đăng nhập thay vì redirect loop.
 * - Single-flight qua ensureSessionRestored() — không tự gọi /auth/refresh.
 */
export default function AdminSessionGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<GateStatus>('checking');

    useEffect(() => {
        let alive = true;
        ensureSessionRestored().then((ok) => {
            if (alive) setStatus(ok ? 'authed' : 'anonymous');
        });
        return () => {
            alive = false;
        };
    }, []);

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <span
                    className="material-symbols-outlined text-primary-600 text-5xl animate-spin"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    progress_activity
                </span>
                <p className="text-sm text-text-secondary">Đang khôi phục phiên đăng nhập…</p>
            </div>
        );
    }

    if (status === 'anonymous') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="bg-white rounded-3xl shadow-card border border-border p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <span
                            className="material-symbols-outlined text-yellow-500 text-4xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            lock
                        </span>
                    </div>
                    <h1 className="font-display font-bold text-xl text-text-primary mb-2">
                        Phiên đăng nhập hết hạn
                    </h1>
                    <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                        Vui lòng đăng nhập bằng tài khoản quản trị để truy cập khu vực này.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">login</span>
                        Đăng nhập
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
