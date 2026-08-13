'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Link đặt lại mật khẩu không hợp lệ. Vui lòng mở lại link trong email.');
            return;
        }

        if (password.length < 8) {
            setError('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post('/auth/reset-password', { token, newPassword: password });
            setDone(true);
        } catch (err) {
            setError(getErrorMessage(err, 'Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-margin-mobile bg-background">
            <main className="w-full max-w-[420px] bg-surface-white rounded-lg shadow-[0_4px_20px_rgba(27,67,50,0.05)] overflow-hidden relative z-10">
                <div className="p-8 md:p-10 flex flex-col items-center">
                    <span className="material-symbols-outlined text-primary text-3xl mb-stack-lg" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>

                    {done ? (
                        <div className="w-full flex flex-col items-center gap-4 py-4">
                            <span className="material-symbols-outlined text-success-leaf text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
                            <div className="text-center">
                                <h1 className="font-headline-md text-headline-md font-bold text-success-leaf mb-2">Đặt lại mật khẩu thành công!</h1>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">
                                    Mật khẩu mới đã được lưu. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
                                </p>
                            </div>
                            <button
                                className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm text-center"
                                type="button"
                                onClick={() => router.push('/login')}
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-stack-lg">
                                <h1 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">Đặt lại mật khẩu</h1>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">Nhập mật khẩu mới cho tài khoản của bạn</p>
                            </div>

                            <form className="w-full space-y-4" onSubmit={handleSubmit}>
                                <div className="relative">
                                    <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="password">Mật khẩu mới</label>
                                    <input
                                        className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md pr-12"
                                        id="password"
                                        placeholder="Tối thiểu 8 ký tự"
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
                                </div>

                                <div className="relative">
                                    <label className="block font-label-bold text-label-bold text-on-surface mb-1.5" htmlFor="confirm_password">Xác nhận mật khẩu mới</label>
                                    <input
                                        className="w-full px-4 py-3 bg-surface-white border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md pr-12"
                                        id="confirm_password"
                                        placeholder="Nhập lại mật khẩu mới"
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

                                {error && (
                                    <div className="text-error-alert text-body-sm font-body-sm">{error}</div>
                                )}

                                <button
                                    className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordContent />
        </Suspense>
    );
}