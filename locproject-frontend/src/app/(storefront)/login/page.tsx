'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';
import { useAuthStore } from '../../../lib/store/auth.store';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-margin-mobile bg-background">
            {/* Atmospheric Background Decoration */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-tertiary-fixed blur-3xl"></div>
            </div>

            {/* Login Card Container */}
            <main className="w-full max-w-[420px] bg-surface-white rounded-lg p-8 login-card-shadow relative z-10 transition-all duration-300">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-stack-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-4xl" data-icon="forest">forest</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">LocHerbal</span>
                    </div>
                    <h1 className="font-headline-md text-headline-md text-primary font-bold mb-1">Đăng nhập</h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Chào mừng bạn trở lại</p>
                </div>

                {/* Form Section */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="font-label-bold text-label-bold text-on-surface" htmlFor="email">Email</label>
                        <div className="relative">
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-outline focus:border-primary-container focus:ring-2 focus:ring-primary/10 transition-all outline-none font-body-md text-body-md text-on-surface"
                                id="email"
                                placeholder="name@company.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                        <label className="font-label-bold text-label-bold text-on-surface" htmlFor="password">Mật khẩu</label>
                        <div className="relative">
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-outline focus:border-primary-container focus:ring-2 focus:ring-primary/10 transition-all outline-none font-body-md text-body-md text-on-surface pr-12"
                                id="password"
                                placeholder="••••••••"
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                            >
                                <span className="material-symbols-outlined" data-icon={showPassword ? 'visibility_off' : 'visibility'}>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Remember & Forgot Password */}
                    <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input className="w-4 h-4 rounded border-outline text-primary-container focus:ring-primary-container transition-all" type="checkbox" />
                            <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">Ghi nhớ đăng nhập</span>
                        </label>
                        <a className="font-body-sm text-body-sm text-primary font-medium hover:underline transition-all" href="#">Quên mật khẩu?</a>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-error-alert text-body-sm font-body-sm">{error}</div>
                    )}

                    {/* Primary Login Button */}
                    <button
                        className="w-full bg-primary-container text-on-primary font-label-bold text-label-bold py-3.5 rounded-lg hover:bg-primary transition-all active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </span>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-outline-variant"></div>
                    </div>
                    <span className="relative px-4 bg-surface-white font-body-sm text-body-sm text-on-surface-variant">hoặc</span>
                </div>

                {/* Google Login */}
                <button className="w-full flex items-center justify-center gap-3 border border-outline text-on-surface font-label-bold text-label-bold py-3.5 rounded-lg hover:bg-surface-container-lowest hover:border-primary transition-all active:scale-[0.98]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    Tiếp tục với Google
                </button>

                {/* Footer Link */}
                <p className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                    Chưa có tài khoản?{' '}
                    <a className="text-primary font-bold hover:underline" href="/register">Đăng ký ngay</a>
                </p>
            </main>
        </div>
    );
}