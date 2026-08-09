'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth.store';
import { useAuthDrawerStore } from '../../lib/store/auth-drawer.store';
import { useToast } from '../../lib/providers/toast-provider';
import { getErrorMessage } from '../../lib/utils/error';

type Tab = 'email' | 'phone';
type OtpPurpose = 'login' | 'register';
type OtpStep = 'phone' | 'code';

// DEV MODE: banner mock OTP chỉ hiện khi build ở development và backend trả code.
// KHÔNG hardcode đúng — kiểm tra qua biến NEXT_PUBLIC_APP_ENV (= 'development').
const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'development';

const OTP_TTL_SECONDS = 5 * 60;

function decodeJwtRoles(accessToken: string): string[] {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return Array.isArray(payload.roles) ? payload.roles : [];
  } catch {
    return [];
  }
}

export default function AuthDrawer() {
  const router = useRouter();
  const toast = useToast();
  const { isDrawerOpen, closeDrawer } = useAuthDrawerStore();

  const [tab, setTab] = useState<Tab>('email');

  /* Email login (giữ nguyên logic từ trang /login) */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  /* Đăng nhập / đăng ký bằng SĐT + OTP */
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('login');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  /* Đóng drawer khi Escape + khóa scroll (giống CartDrawer) */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  /* Reset trạng thái mỗi khi drawer vừa mở */
  useEffect(() => {
    if (isDrawerOpen) {
      setTab('email');
      setEmailError('');
      setOtpError('');
      setDevCode(null);
      setCountdown(0);
    }
  }, [isDrawerOpen]);

  /* Đếm ngược 5 phút cho nút "Gửi lại mã" */
  useEffect(() => {
    if (!isDrawerOpen || countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [isDrawerOpen, countdown]);

  const afterLogin = useCallback((accessToken: string) => {
    const isAdmin = decodeJwtRoles(accessToken).includes('admin');
    closeDrawer();
    router.push(isAdmin ? '/admin' : '/');
  }, [closeDrawer, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      toast.success(`Chào mừng trở lại, ${data.user?.fullName || data.user?.email}!`);
      afterLogin(data.accessToken);
    } catch (err) {
      setEmailError(getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!/^0[3-9]\d{8}$/.test(phone)) {
      setOtpError('Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu 03-09).');
      return;
    }
    setOtpLoading(true);
    try {
      const { data } = await apiClient.post('/auth/otp/request', { phone, purpose: otpPurpose });
      setDevCode(IS_DEV && data?.code ? String(data.code) : '');
      setOtpStep('code');
      setCountdown(OTP_TTL_SECONDS);
      toast.success('Mã OTP đã được gửi đến số điện thoại của bạn.');
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    try {
      const { data } = await apiClient.post('/auth/otp/verify', { phone, code, purpose: otpPurpose });
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      toast.success(otpPurpose === 'register' ? 'Đăng ký thành công!' : 'Đăng nhập thành công!');
      afterLogin(data.accessToken);
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Xác thực OTP thất bại. Vui lòng thử lại.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtpError('');
    setCountdown(0);
    try {
      const { data } = await apiClient.post('/auth/otp/request', { phone, purpose: otpPurpose });
      setDevCode(IS_DEV && data?.code ? String(data.code) : '');
      setCountdown(OTP_TTL_SECONDS);
      setCode('');
      toast.success('Đã gửi lại mã OTP mới.');
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Không thể gửi lại mã OTP.'));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[150] transition-opacity duration-300
        ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!isDrawerOpen}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />

      <div
        data-testid="auth-drawer"
        className={`absolute bg-white shadow-xl flex flex-col
                    transition-transform duration-300 ease-in-out
                    bottom-0 left-0 right-0 h-[92dvh] rounded-t-3xl
                    md:top-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:w-full md:max-w-[420px] md:rounded-none
                    ${isDrawerOpen
                      ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
                      : 'translate-y-full md:translate-y-0 md:translate-x-full'
                    }`}
      >
        {isDrawerOpen && (
          <>
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-700">login</span>
            <h2 className="font-display font-bold text-lg text-text-primary">
              Đăng nhập
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng đăng nhập"
          >
            <span className="material-symbols-outlined text-text-secondary text-2xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-alt rounded-xl">
            {(['email', 'phone'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === t ? 'bg-primary-700 text-white shadow-sm' : 'text-text-secondary hover:text-primary-700'}`}
              >
                {t === 'email' ? 'Email' : 'Số điện thoại'}
</button>
              ))}
          </div>

          {tab === 'email' ? (
            <form className="space-y-4" onSubmit={handleEmailLogin}>
              <div className="space-y-1.5">
                <input
                  className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm pr-12"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary-700 transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <span className="material-symbols-outlined text-base">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {emailError && (
                <div className="text-error text-xs font-medium">{emailError}</div>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
              >
                {emailLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <PhoneOtpForm
              otpStep={otpStep}
              otpPurpose={otpPurpose}
              phone={phone}
              setPhone={setPhone}
              setOtpPurpose={setOtpPurpose}
              setOtpStep={setOtpStep}
              code={code}
              setCode={setCode}
              otpError={otpError}
              otpLoading={otpLoading}
              devCode={devCode}
              countdown={countdown}
              onRequest={handleOtpRequest}
              onVerify={handleOtpVerify}
              onResend={handleResendCode}
            />
          )}

          {/* Footer fallback */}
          <p className="text-center text-xs text-text-secondary pt-2">
            Chưa có tài khoản?{' '}
            <Link href="/register" onClick={closeDrawer} className="text-primary font-bold hover:underline">
              Đăng ký Email
            </Link>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Tab "Số điện thoại" ───────────────────────────────────────────── */
interface PhoneFormTabProps {
  otpStep: OtpStep;
  otpPurpose: OtpPurpose;
  phone: string;
  setPhone: (v: string) => void;
  setOtpPurpose: (v: OtpPurpose) => void;
  setOtpStep: (v: OtpStep) => void;
  code: string;
  setCode: (v: string) => void;
  otpError: string;
  otpLoading: boolean;
  devCode: string | null;
  countdown: number;
  onRequest: (e: React.FormEvent) => void;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => void;
}

function PhoneOtpForm(props: PhoneFormTabProps) {
  const {
    otpStep, otpPurpose, phone, setPhone, setOtpPurpose, setOtpStep,
    code, setCode, otpError, otpLoading, devCode, countdown,
    onRequest, onVerify, onResend,
  } = props;

  if (otpStep === 'phone') {
    return (
      <form className="space-y-4" onSubmit={onRequest}>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-alt rounded-xl">
          {(['login', 'register'] as OtpPurpose[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setOtpPurpose(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${otpPurpose === p ? 'bg-primary-700 text-white shadow-sm' : 'text-text-secondary hover:text-primary-700'}`}
            >
              {p === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <input
          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
          type="tel"
          inputMode="numeric"
          placeholder="0912345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          required
          maxLength={10}
          autoComplete="tel"
        />

        {otpError && (
          <div className="text-error text-xs font-medium">{otpError}</div>
        )}

        <button
          type="submit"
          disabled={otpLoading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
        >
          {otpLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>
      </form>
    );
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <form className="space-y-4" onSubmit={onVerify}>
      {devCode && (
        <div className="px-3 py-2 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-semibold">
          DEV MODE: Mã OTP là {devCode}
        </div>
      )}

      <div>
        <label className="text-xs text-text-secondary font-medium">Mã xác thực 6 số</label>
        <input
          className="mt-1.5 w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm tracking-widest text-center"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          required
        />
      </div>

      {otpError && (
        <div className="text-error text-xs font-medium">{otpError}</div>
      )}

      <button
        type="submit"
        disabled={otpLoading}
        className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
      >
        {otpLoading ? 'Đang xác thực...' : 'Xác thực & hoàn tất'}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          disabled={countdown > 0}
          onClick={onResend}
          className="text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          Gửi lại mã {countdown > 0 && `(${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')})`}
        </button>
        <button
          type="button"
          disabled={otpLoading}
          onClick={() => setOtpStep('phone')}
          className="text-text-secondary hover:text-primary-700 transition-colors disabled:opacity-50"
        >
          Đổi số khác
        </button>
      </div>
    </form>
  );
}