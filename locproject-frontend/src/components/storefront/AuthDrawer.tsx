'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api/client';
import { useAuthStore } from '../../lib/store/auth.store';
import { useAuthDrawerStore, type AuthDrawerTab } from '../../lib/store/auth-drawer.store';
import { useToast } from '../../lib/providers/toast-provider';
import { getErrorMessage } from '../../lib/utils/error';

/* Tab chính của sidebar: Đăng nhập | Đăng ký | OTP nhanh */
type Tab = AuthDrawerTab;
type OtpStep = 'phone' | 'code';

// DEV MODE: banner mock OTP chỉ hiện khi build ở development và backend trả code.
// KHÔNG hardcode đúng — kiểm tra qua biến NEXT_PUBLIC_APP_ENV (= 'development').
const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'development';

const OTP_TTL_SECONDS = 2 * 60;  // Mã OTP chỉ có hiệu lực 2 phút (khớp backend)
const OTP_RESEND_COOLDOWN = 60;  // Chờ 60s giữa 2 lần gửi lại mã

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
  const { isDrawerOpen, closeDrawer, initialTab } = useAuthDrawerStore();

  const [tab, setTab] = useState<Tab>('login');

  /* Email login (giữ nguyên logic từ trang /login) */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  /* Đăng ký — form xác thực danh tính khớp DB (fullName, email, phone, password) */
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regPending, setRegPending] = useState<string | null>(null);
  const [regResending, setRegResending] = useState(false);
  const [regResendMsg, setRegResendMsg] = useState('');

  /* Xác thực SMS OTP — chỉ dùng để ĐĂNG NHẬP, không đăng ký qua OTP */
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0); // giây còn lại trước khi mã HẾT HẠN (2 phút)
  const [resendIn, setResendIn] = useState(0);   // giây chờ trước khi được "Gửi lại mã"

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

  /* Reset trạng thái mỗi khi drawer vừa mở + mở đúng tab được yêu cầu */
  useEffect(() => {
    if (isDrawerOpen) {
      setTab(initialTab);
      setEmailError('');
      setOtpError('');
      setDevCode(null);
      setCountdown(0);
      setResendIn(0);
      setRegError('');
      setRegPending(null);
      setRegResendMsg('');
    }
  }, [isDrawerOpen, initialTab]);

  /* Đếm ngược: hết hạn mã (2 phút) + cooldown gửi lại (60s) */
  useEffect(() => {
    if (!isDrawerOpen || (countdown <= 0 && resendIn <= 0)) return;
    const timer = setInterval(() => {
      setCountdown((s) => (s > 0 ? s - 1 : 0));
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isDrawerOpen, countdown, resendIn]);

  const afterLogin = useCallback((accessToken: string) => {
    const isAdmin = decodeJwtRoles(accessToken).includes('admin');
    closeDrawer();
    // Chỉ admin được điều hướng sang /admin (giữ nguyên RBAC cũ).
    // User thường Ở LẠI nguyên trang hiện tại — auth hoàn tất ngay trong sidebar.
    if (isAdmin) router.push('/admin');
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
      // OTP chỉ phục vụ đăng nhập — purpose cố định 'login'
      const { data } = await apiClient.post('/auth/otp/request', { phone, purpose: 'login' });
      setDevCode(IS_DEV && data?.code ? String(data.code) : '');
      setOtpStep('code');
      setCode('');
      setCountdown(OTP_TTL_SECONDS);      // mã hết hạn sau 2 phút
      setResendIn(OTP_RESEND_COOLDOWN);   // chờ 60s mới gửi lại được
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
      const { data } = await apiClient.post('/auth/otp/verify', { phone, code, purpose: 'login' });
      useAuthStore.getState().setAuth(data.accessToken, data.user);
      toast.success('Đăng nhập thành công!');
      afterLogin(data.accessToken);
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Xác thực OTP thất bại. Vui lòng thử lại.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    setOtpError('');
    try {
      const { data } = await apiClient.post('/auth/otp/request', { phone, purpose: 'login' });
      setDevCode(IS_DEV && data?.code ? String(data.code) : '');
      setCode('');
      setCountdown(OTP_TTL_SECONDS);
      setResendIn(OTP_RESEND_COOLDOWN);
      toast.success('Đã gửi lại mã OTP mới.');
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Không thể gửi lại mã OTP.'));
    }
  };

  /* ── Đăng ký: form xác thực danh tính đầy đủ, khớp schema DB (User:
     fullName, email unique, phone?, passwordHash) ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!/^0[3-9]\d{8}$/.test(regPhone)) {
      setRegError('Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu 03-09).');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (!regAgree) {
      setRegError('Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.');
      return;
    }
    setRegLoading(true);
    try {
      await apiClient.post('/auth/register', {
        fullName: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      // Không auto-login — giữ nguyên flow xác thực email của backend
      setRegPending(regEmail);
      toast.success('Tài khoản đã được tạo! Kiểm tra email để xác thực.');
    } catch (err) {
      setRegError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setRegLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!regPending) return;
    setRegResending(true);
    setRegResendMsg('');
    try {
      await apiClient.post('/auth/resend-verification', { email: regPending });
      setRegResendMsg('Đã gửi lại link xác thực. Kiểm tra hộp thư (hoặc spam).');
    } catch (err) {
      setRegResendMsg(getErrorMessage(err, 'Không gửi lại được. Thử lại sau.'));
    } finally {
      setRegResending(false);
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
        className={`absolute shadow-xl flex flex-col
                    transition-transform duration-300 ease-in-out
                    bottom-0 left-0 right-0 h-[92dvh] rounded-t-3xl
                    md:top-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:w-full
                    md:max-w-[400px] lg:w-[25vw] lg:min-w-[380px] lg:max-w-[440px] md:rounded-none
                    ${isDrawerOpen
                      ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
                      : 'translate-y-full md:translate-y-0 md:translate-x-full'
                    }`}
        style={{
          // Nền drawer auth — ảnh chứng nhận (authentication.jpg) dạng CSS layer:
          // overlay trắng-sage sáng đè lên ảnh, form vẫn nổi bật và dễ đọc
          backgroundColor: '#faf9f6',
          backgroundImage:
            'linear-gradient(180deg, rgba(250,249,246,0.93) 0%, rgba(233,237,230,0.80) 45%, rgba(250,249,246,0.93) 100%), url(/images/decor/authentication.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {isDrawerOpen && (
          <>
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header — tiêu đề theo tab + nút đóng X */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-700">login</span>
            <h2 className="font-display font-bold text-lg text-text-primary">
              {tab === 'login' ? 'Đăng nhập' : tab === 'register' ? 'Tạo tài khoản' : 'Xác thực SMS OTP'}
            </h2>
          </div>
          <button
            type="button"
            data-testid="auth-drawer-close"
            onClick={closeDrawer}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng bảng đăng nhập"
          >
            <span className="material-symbols-outlined text-text-secondary text-2xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* Segmented control — Đăng nhập / Đăng ký / OTP nhanh */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface-alt rounded-xl">
            {([
              { key: 'login', label: 'Đăng nhập', icon: 'login' },
              { key: 'register', label: 'Đăng ký', icon: 'person_add' },
              { key: 'otp', label: 'OTP nhanh', icon: 'sms' },
            ] as { key: Tab; label: string; icon: string }[]).map((t) => (
              <button
                key={t.key}
                type="button"
                data-testid={`auth-tab-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all
                  ${tab === t.key ? 'bg-primary-700 text-white shadow-sm' : 'text-text-secondary hover:text-primary-700'}`}
              >
                <span className="material-symbols-outlined text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'otp' ? (
            <PhoneOtpForm
              otpStep={otpStep}
              phone={phone}
              setPhone={setPhone}
              setOtpStep={setOtpStep}
              code={code}
              setCode={setCode}
              otpError={otpError}
              otpLoading={otpLoading}
              devCode={devCode}
              expiry={countdown}
              resendIn={resendIn}
              onRequest={handleOtpRequest}
              onVerify={handleOtpVerify}
              onResend={handleResendCode}
            />
          ) : tab === 'register' ? (
            <RegisterForm
              name={regName}
              setName={setRegName}
              email={regEmail}
              setEmail={setRegEmail}
              phone={regPhone}
              setPhone={setRegPhone}
              password={regPassword}
              setPassword={setRegPassword}
              confirmPassword={regConfirmPassword}
              setConfirmPassword={setRegConfirmPassword}
              agree={regAgree}
              setAgree={setRegAgree}
              error={regError}
              loading={regLoading}
              pending={regPending}
              resending={regResending}
              resendMsg={regResendMsg}
              onSubmit={handleRegister}
              onResend={handleResendVerification}
              onGoLogin={() => setTab('login')}
            />
          ) : (
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
          )}

          {/* Quick-switch giữa các tab — không rời khỏi sidebar */}
          {tab === 'login' && (
            <p className="text-center text-xs text-text-secondary pt-2">
              Chưa có tài khoản?{' '}
              <button type="button" onClick={() => setTab('register')} className="text-primary font-bold hover:underline">
                Đăng ký ngay
              </button>
            </p>
          )}
          {tab === 'otp' && (
            <p className="text-center text-xs text-text-secondary pt-2">
              Mã OTP có hiệu lực <strong className="text-text-primary">2 phút</strong>. Chưa nhận được SMS? Nhấn
              &quot;Gửi lại mã&quot; sau 60 giây.
            </p>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Tab "Xác thực SMS OTP" — chỉ ĐĂNG NHẬP, mã hết hạn sau 2 phút ─────── */
interface PhoneFormTabProps {
  otpStep: OtpStep;
  phone: string;
  setPhone: (v: string) => void;
  setOtpStep: (v: OtpStep) => void;
  code: string;
  setCode: (v: string) => void;
  otpError: string;
  otpLoading: boolean;
  devCode: string | null;
  expiry: number;   // giây còn lại trước khi mã hết hạn
  resendIn: number; // giây chờ trước khi gửi lại được
  onRequest: (e: React.FormEvent) => void;
  onVerify: (e: React.FormEvent) => void;
  onResend: () => void;
}

function PhoneOtpForm(props: PhoneFormTabProps) {
  const {
    otpStep, phone, setPhone, setOtpStep,
    code, setCode, otpError, otpLoading, devCode, expiry, resendIn,
    onRequest, onVerify, onResend,
  } = props;

  if (otpStep === 'phone') {
    return (
      <form className="space-y-4" onSubmit={onRequest}>
        <p className="text-xs text-text-secondary leading-relaxed">
          Nhập số điện thoại để nhận mã xác thực <strong className="text-text-primary">SMS OTP</strong> —
          mã gồm 6 số và chỉ có hiệu lực trong 2 phút.
        </p>

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

  const expired = expiry <= 0;
  const mm = String(Math.floor(expiry / 60)).padStart(2, '0');
  const ss = String(expiry % 60).padStart(2, '0');
  const rmm = String(Math.floor(resendIn / 60)).padStart(2, '0');
  const rss = String(resendIn % 60).padStart(2, '0');

  return (
    <form className="space-y-4" onSubmit={onVerify}>
      {devCode && (
        <div className="px-3 py-2 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-semibold">
          DEV MODE: Mã OTP là {devCode}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-text-secondary font-medium">Mã xác thực 6 số</label>
          <span
            data-testid="otp-expiry"
            className={`text-xs font-bold tabular-nums ${expired ? 'text-error' : 'text-primary-700'}`}
          >
            {expired ? 'Mã đã hết hạn' : `Hết hạn sau ${mm}:${ss}`}
          </span>
        </div>
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

      {expired && (
        <div className="px-3 py-2 rounded-lg bg-surface-alt text-text-secondary text-xs">
          Mã OTP đã hết hạn sau 2 phút. Nhấn <strong>&quot;Gửi lại mã&quot;</strong> để nhận mã mới.
        </div>
      )}

      {otpError && (
        <div className="text-error text-xs font-medium">{otpError}</div>
      )}

      <button
        type="submit"
        disabled={otpLoading || expired || code.length < 6}
        className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
      >
        {otpLoading ? 'Đang xác thực...' : 'Xác thực & hoàn tất'}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          disabled={resendIn > 0 || otpLoading}
          onClick={onResend}
          className="text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          Gửi lại mã {resendIn > 0 && `(${rmm}:${rss})`}
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

/* ─── Tab "Đăng ký" — form xác thực danh tính khớp DB (users table) ────────
 * Trường dữ liệu bám sát schema Prisma User: fullName, email (unique),
 * phone?, password → passwordHash. Không có trường nào ngoài DB. */
interface RegisterFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  agree: boolean;
  setAgree: (v: boolean) => void;
  error: string;
  loading: boolean;
  pending: string | null;
  resending: boolean;
  resendMsg: string;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onGoLogin: () => void;
}

function passwordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function RegisterForm(props: RegisterFormProps) {
  const {
    name, setName, email, setEmail, phone, setPhone,
    password, setPassword, confirmPassword, setConfirmPassword,
    agree, setAgree, error, loading, pending, resending, resendMsg,
    onSubmit, onResend, onGoLogin,
  } = props;

  /* Trạng thái chờ xác thực email — hiển thị ngay trong sidebar */
  if (pending) {
    return (
      <div className="space-y-4 text-center py-4">
        <span
          className="material-symbols-outlined text-5xl text-primary-600"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mark_email_read
        </span>
        <h3 className="font-semibold text-text-primary">Kiểm tra email của bạn</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Chúng tôi đã gửi link xác thực đến{' '}
          <strong className="break-all text-text-primary">{pending}</strong>.
          <br />
          Nhấn link trong email để kích hoạt tài khoản, sau đó đăng nhập ở tab
          &quot;Đăng nhập&quot;.
        </p>
        <button
          type="button"
          disabled={resending}
          onClick={onResend}
          className="w-full border border-primary-700 text-primary-700 hover:bg-primary-50 font-semibold py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
        >
          {resending ? 'Đang gửi lại...' : 'Gửi lại email xác thực'}
        </button>
        {resendMsg && <p className="text-xs text-success">{resendMsg}</p>}
        <button
          type="button"
          onClick={onGoLogin}
          className="text-xs text-primary font-bold hover:underline"
        >
          ← Về đăng nhập
        </button>
      </div>
    );
  }

  const strength = passwordStrength(password);
  const strengthLabels = ['Quá ngắn', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  const strengthColors = ['bg-error-alert', 'bg-error-alert', 'bg-secondary', 'bg-secondary-container', 'bg-primary-600'];

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input
        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
        type="text"
        placeholder="Họ và tên"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
      />

      <input
        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <input
        className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
        type="tel"
        inputMode="numeric"
        placeholder="Số điện thoại (0912345678)"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
        required
        maxLength={10}
        pattern="0[3-9][0-9]{8}"
        title="Số điện thoại Việt Nam 10 số, bắt đầu từ 03-09"
        autoComplete="tel"
      />

      <div className="space-y-1.5">
        <input
          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
          type="password"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {password.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-surface-alt overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`}
                style={{ width: `${(strength / 4) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-secondary font-medium w-16 text-right">
              {strengthLabels[strength]}
            </span>
          </div>
        )}
        <input
          className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary-500 focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {confirmPassword.length > 0 && confirmPassword !== password && (
          <p className="text-error text-[10px] font-medium">Mật khẩu nhập lại chưa khớp</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          className="mt-0.5 w-4 h-4 text-primary-700 border-border rounded cursor-pointer"
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
        />
        <span className="text-xs text-text-secondary leading-snug">
          Tôi đồng ý với <span className="text-primary font-medium">Điều khoản sử dụng</span> và{' '}
          <span className="text-primary font-medium">Chính sách bảo mật</span>
        </span>
      </label>

      {error && <div className="text-error text-xs font-medium">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
      >
        {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>
    </form>
  );
}