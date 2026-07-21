'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';
import { useAuthStore } from '../../../lib/store/auth.store';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getPasswordStrength(password);
    const strengthLabels = ['Quá ngắn', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
    const strengthColors = ['bg-error-alert', 'bg-error-alert', 'bg-secondary', 'bg-secondary-container', 'bg-success-leaf'];
    const emptyPasswordText = 'Mật khẩu cần ít nhất 8 ký tự';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (!agreeTerms) {
            setError('Bạn phải đồng ý với điều khoản sử dụng');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/register', {
                name,
                email,
                password,
            });

            if (response.data) {
                // Auto login after successful registration
                await useAuthStore.getState().login(email, password);
                router.push('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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

            {/* Register Card Container */}
            <main className="w-full max-w-[420px] bg-surface-white rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] overflow-hidden relative z-10">
                <div className="p-8 md:p-10 flex flex-col items-center">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2 mb-stack-lg">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">LocHerbal</span>
                    </div>

                    {/* Header Text */}
                    <div className="text-center mb-stack-lg">
                        <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Tạo tài khoản</h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Tham gia cùng hàng nghìn khách hàng tin dùng</p>
                    </div>

                    {/* Registration Form */}
                    <form className="w-full space-y-4" onSubmit={handleSubmit}>
                        {/* Họ và tên */}
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="name">Họ và tên</label>
                            <input
                                className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md"
                                id="name"
                                placeholder="Nhập họ và tên"
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Email */}
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

                        {/* Mật khẩu */}
                        <div className="relative">
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="password">Mật khẩu</label>
                            <input
                                className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md pr-12"
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
                                <span className="material-symbols-outlined">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>

                            {/* Strength Indicator */}
                            <div className="mt-2 flex flex-col gap-1.5">
                                <div className="strength-bar-bg">
                                    <div
                                        className={`strength-bar ${password ? (strengthColors[strength] || 'bg-error-alert') : ''}`}
                                        style={{ width: password ? `${strength * 25}%` : '0%' }}
                                    ></div>
                                </div>
                                <p className={`font-caption text-caption ${strength === 4 ? 'text-success-leaf' : 'text-on-surface-variant'}`}>
                                    {password ? "Độ bảo mật: " + strengthLabels[strength] : emptyPasswordText}
                                </p>
                            </div>
                        </div>

                        {/* Xác nhận mật khẩu */}
                        <div className="relative">
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                            <input
                                className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md pr-12"
                                id="confirm_password"
                                placeholder="••••••••"
                                required
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                type="button"
                            >
                                <span className="material-symbols-outlined">
                                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                className="mt-1 w-4 h-4 text-primary border-outline rounded focus:ring-primary cursor-pointer"
                                id="terms"
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                required
                            />
                            <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="terms">
                                Tôi đồng ý với <a className="text-primary font-medium hover:underline" href="#">Điều khoản sử dụng</a> và <a className="text-primary font-medium hover:underline" href="#">Chính sách bảo mật</a>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-error-alert text-body-sm font-body-sm">{error}</div>
                        )}

                        {/* Primary Button */}
                        <button
                            className="w-full mt-4 bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
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
                                'Tạo tài khoản'
                            )}
                        </button>
                    </form>

                    {/* Bottom Text */}
                    <div className="mt-8 text-center">
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Đã có tài khoản? <a className="text-primary font-bold hover:underline" href="/login">Đăng nhập</a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}