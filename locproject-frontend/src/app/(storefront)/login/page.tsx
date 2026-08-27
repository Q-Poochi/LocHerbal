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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-[420px] bg-surface-white rounded-lg p-8 login-card-shadow relative z-10">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-4xl" data-icon="forest">forest</span>
                        <span className="text-2xl font-bold text-primary tracking-tight">LocHerbal</span>
                    </div>
                    <h1 className="text-xl font-bold text-primary mb-1">Đăng nhập</h1>
                    <p className="text-sm text-on-surface-variant">Chào mừng bạn trở lại</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-error-container text-error text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-on-surface" htmlFor="email">Email</label>
                        <div className="relative">
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-outline focus:border-primary-container focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm text-on-surface"
                                id="email"
                                placeholder="name@company.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-on-surface" htmlFor="password">Mật khẩu</label>
                            <a className="text-xs text-primary font-medium hover:underline" href="/forgot-password">
                                Quên mật khẩu?
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-outline focus:border-primary-container focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm text-on-surface pr-11"
                                id="password"
                                placeholder="••••••••"
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
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
                        className="w-full py-3.5 rounded-lg bg-primary text-on-primary font-bold text-sm tracking-wide shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-on-surface-variant">
                    Chưa có tài khoản?{' '}
                    <a className="text-primary font-bold hover:underline" href="/register">Đăng ký ngay</a>
                </p>
            </div>
        </div>
    );
}