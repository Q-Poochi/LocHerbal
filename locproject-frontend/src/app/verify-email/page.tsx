'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Thiếu token xác thực. Vui lòng mở link trong email của bạn.');
            return;
        }

        let cancelled = false;
        apiClient
            .get('/auth/verify-email', { params: { token } })
            .then(() => {
                if (!cancelled) setStatus('success');
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setStatus('error');
                    setMessage(getErrorMessage(err, 'Link xác thực không hợp lệ hoặc đã hết hạn.'));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-margin-mobile bg-background">
            <main className="w-full max-w-[420px] bg-surface-white rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] overflow-hidden relative z-10">
                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined mb-4 text-6xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        {status === 'loading' ? 'hourglass_top' : status === 'success' ? 'verified' : 'error'}
                    </span>

                    {status === 'loading' && (
                        <>
                            <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Đang xác thực...</h1>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Vui lòng chờ trong giây lát.
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <h1 className="font-headline-md text-headline-md font-bold text-success-leaf mb-2">Xác thực thành công!</h1>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
                                Email của bạn đã được xác minh. Giờ bạn có thể đăng nhập và sử dụng tài khoản.
                            </p>
                            <a
                                href="/login"
                                className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm text-center"
                            >
                                Đăng nhập ngay
                            </a>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h1 className="font-headline-md text-headline-md font-bold text-error-alert mb-2">Không thể xác thực</h1>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">{message}</p>
                            <a
                                href="/login"
                                className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm text-center"
                            >
                                Quay lại trang đăng nhập
                            </a>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmailContent />
        </Suspense>
    );
}