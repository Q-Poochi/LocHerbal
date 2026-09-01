'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';
import { useAuthStore } from '../../../lib/store/auth.store';
import { useToast } from '../../../lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';

export default function LoginPage() {
    const router = useRouter();
    const [redirectTo, setRedirectTo] = useState('/');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setRedirectTo(params.get('redirect') || '/');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const data = response.data;
            console.log('[Login] backend response:', data);
            const { accessToken, user } = data;
            useAuthStore.getState().setAuth(accessToken, user);

            toast.success(`Chào mừng trở lại, ${user?.fullName || user?.email}!`);

            // Decode JWT payload để kiểm tra role
            let isAdmin = false;
            try {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                isAdmin = payload.roles?.includes('admin');
            } catch {}

            // Admin → /admin, còn lại → redirectTo (mặc định /)
            router.push(isAdmin ? '/admin' : redirectTo);
        } catch (err) {
            setError(getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="relative z-10 flex-1 min-h-[100dvh] flex items-center justify-center p-4 py-12 overflow-hidden
                       bg-[#ccd6c8] bg-[url('/images/floral-sage.webp')] bg-cover bg-center bg-no-repeat md:bg-none"
        >
            {/* Nền trang trí: mobile = ảnh đầy đủ phủ kín; desktop = 4 góc hoa ở kích thước gốc (sắc nét) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
                <div className="absolute top-0 left-0 w-[424px] h-[632px] bg-no-repeat bg-left-top bg-[url('/images/floral-tl.webp')]" />
                <div className="absolute top-0 right-0 w-[424px] h-[632px] bg-no-repeat bg-right-top bg-[url('/images/floral-tr.webp')]" />
                <div className="absolute bottom-0 left-0 w-[424px] h-[632px] bg-no-repeat bg-left-bottom bg-[url('/images/floral-bl.webp')]" />
                <div className="absolute bottom-0 right-0 w-[424px] h-[632px] bg-no-repeat bg-right-bottom bg-[url('/images/floral-br.webp')]" />
            </div>
            <div className="w-full max-w-[420px] bg-surface-white/95 rounded-2xl p-8 shadow-botanical border border-outline-variant/40">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-4xl" data-icon="forest">forest</span>
                        <span className="text-2xl font-bold text-primary tracking-tight font-display">LocHerbal</span>
                    </div>
                    <h1 className="font-headline-md text-headline-md text-primary mb-1">Đăng nhập</h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Chào mừng trở lại LocHerbal</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-error-container text-error text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em]" htmlFor="email">Email hoặc số điện thoại</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                                <span className="material-symbols-outlined text-xl">person</span>
                            </span>
                            <input
                                className="w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant/60 bg-surface-container-low/40
                                           focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none
                                           transition-all font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/40"
                                id="email"
                                placeholder="Nhập email hoặc SĐT"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em]" htmlFor="password">Mật khẩu</label>
                            <a className="font-label-caps text-label-caps text-primary font-medium hover:underline" href="/forgot-password">
                                Quên mật khẩu?
                            </a>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                                <span className="material-symbols-outlined text-xl">lock</span>
                            </span>
                            <input
                                className="w-full pl-12 pr-12 py-3 rounded-full border border-outline-variant/60 bg-surface-container-low/40
                                           focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none
                                           transition-all font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/40"
                                id="password"
                                placeholder="••••••••"
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-1"
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <button
                        className="w-full py-4 rounded-full bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.1em]
                                   shadow-botanical hover:bg-primary-container hover:shadow-botanical-hover active:scale-[0.99] transition-all duration-300
                                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <p className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                    Chưa có tài khoản?{' '}
                    <a className="text-primary font-bold hover:underline" href="/register">Đăng ký ngay</a>
                </p>
            </div>
        </div>
    );
}