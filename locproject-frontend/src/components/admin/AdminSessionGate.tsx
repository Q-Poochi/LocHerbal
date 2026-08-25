'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureSessionRestored } from '@/lib/auth/session-restore';

type GateStatus = 'checking' | 'authed' | 'anonymous';

/**
 * Cổng bảo vệ cho toàn bộ khu vực /admin:
 * - Hard-reload làm mất accessToken trong RAM → các fetch dữ liệu bắn ra
 *   TRƯỚC khi refreshSession kịp hoàn tất sẽ dính 401 → trang dashboard
 *   crash vào error boundary (bug phát hiện qua beta test).
 * - Gate này CHỜ phiên khôi phục xong mới render children.
 * - Chưa đăng nhập → redirect /login (giữ nguyên hợp đồng cũ của route guard,
 *   kèm ?redirect= để sau đăng nhập quay lại đúng trang đang định vào).
 * - Single-flight qua ensureSessionRestored() — không tự gọi /auth/refresh.
 */
export default function AdminSessionGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [status, setStatus] = useState<GateStatus>('checking');

    useEffect(() => {
        let alive = true;
        ensureSessionRestored().then((ok) => {
            if (!alive) return;
            if (ok) {
                setStatus('authed');
            } else {
                setStatus('anonymous');
                const here = window.location.pathname + window.location.search;
                router.replace(`/login?redirect=${encodeURIComponent(here)}`);
            }
        });
        return () => {
            alive = false;
        };
    }, [router]);

    if (status !== 'authed') {
        // checking: chờ khôi phục; anonymous: đang điều hướng sang /login
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <span
                    className="material-symbols-outlined text-primary-600 text-5xl animate-spin"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    progress_activity
                </span>
                <p className="text-sm text-text-secondary">
                    {status === 'checking' ? 'Đang khôi phục phiên đăng nhập…' : 'Chuyển hướng đến trang đăng nhập…'}
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
