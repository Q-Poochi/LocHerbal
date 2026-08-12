'use client';

import { Suspense, useState } from 'react';
import { apiClient } from '../../../lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

function ResendVerificationContent() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            await apiClient.post('/auth/resend-verification', { email });
            setMessage('Link xác thực đã được gửi lại. Kiểm tra hộp thư (hoặc thư rác).');
        } catch (err) {
            setIsError(true);
            setMessage(getErrorMessage(err, 'Không gửi lại được. Thử lại sau.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-margin-mobile bg-background">
            <main className="w-full max-w-[420px] bg-surface-white rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] overflow-hidden relative z-10">
                <div className="p-8 md:p-10 flex flex-col items-center">
                    <span className="material-symbols-outlined text-primary text-3xl mb-stack-lg" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>

                    <div className="text-center mb-stack-lg">
                        <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Gửi lại link xác thực</h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Nhập email đã đăng ký, chúng tôi sẽ gửi link xác thực mới</p>
                    </div>

                    <form className="w-full space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="email">Email</label>
                            <input
                                className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md"
                                id="email"
                                placeholder="example@gmail.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {message && (
                            <div className={`font-body-sm text-body-sm ${isError ? 'text-error-alert' : 'text-success-leaf'}`}>{message}</div>
                        )}

                        <button
                            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi lại link'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Đã xác thực? <a className="text-primary font-bold hover:underline" href="/login">Đăng nhập</a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ResendVerificationPage() {
    return (
        <Suspense fallback={null}>
            <ResendVerificationContent />
        </Suspense>
    );
}