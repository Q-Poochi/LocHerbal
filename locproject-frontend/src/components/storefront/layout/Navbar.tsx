'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartCount } from '../../../lib/hooks/useProducts';
import { useAuthStore } from '../../../lib/store/auth.store';
import { useCartStore } from '../../../lib/store/cart.store';
import { apiClient } from '../../../lib/api/client';
import { useToast } from '../../../lib/providers/toast-provider';

/* ─── Mega-dropdown data (static — hardcoded từ DB categories) ─── */
const MEGA_CATEGORIES = [
  {
    name: 'Tim Mạch',
    icon: 'favorite',
    href: '/products?categoryId=tim-mach',
    gradient: 'from-rose-50 to-red-100',
    iconColor: 'text-rose-500',
    products: [
      { name: 'Ích Tâm Khang', slug: 'ich-tam-khang' },
      { name: 'Hạnh Phúc Huyết Áp', slug: 'hanh-phuc-huyet-ap' },
      { name: 'Hoạt Huyết Dưỡng Não', slug: 'hoat-huyet-duong-nao' },
    ],
  },
  {
    name: 'Xương Khớp',
    icon: 'accessibility_new',
    href: '/products?categoryId=xuong-khop',
    gradient: 'from-amber-50 to-orange-100',
    iconColor: 'text-amber-500',
    products: [
      { name: 'Cốt Thoái Vương', slug: 'cot-thoai-vuong' },
      { name: 'Khớp Tâm Bình', slug: 'khop-tam-binh' },
      { name: 'Xương Khớp Vàng', slug: 'xuong-khop-vang' },
    ],
  },
  {
    name: 'Tiêu Hóa',
    icon: 'local_florist',
    href: '/products?categoryId=tieu-hoa',
    gradient: 'from-green-50 to-emerald-100',
    iconColor: 'text-emerald-500',
    products: [
      { name: 'Tràng Phục Linh', slug: 'trang-phuc-linh' },
      { name: 'Tiêu Hóa Khang', slug: 'tieu-hoa-khang' },
      { name: 'Bình Vị Thái', slug: 'binh-vi-thai' },
    ],
  },
  {
    name: 'An Thần',
    icon: 'bedtime',
    href: '/products?categoryId=an-than-ngu-ngon',
    gradient: 'from-blue-50 to-indigo-100',
    iconColor: 'text-indigo-500',
    products: [
      { name: 'Ngủ Ngon Thảo Mộc', slug: 'ngu-ngon-thao-moc' },
      { name: 'An Thần Tâm Bình', slug: 'an-than-tam-binh' },
      { name: 'Dưỡng Tâm An Thần', slug: 'duong-tam-an-than' },
    ],
  },
];

/* ─── Search Overlay ─────────────────────────────────────────────── */
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Auto-focus khi mở */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [open]);

  /* Đóng khi nhấn Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/products', { params: { search: query, limit: 10 } });
        setResults(res.data?.data ?? res.data ?? []);
      } catch { setResults([]); }
      finally { setIsLoading(false); }
    }, 300);
  }, [query]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary-100 text-primary-800 rounded px-0.5 not-italic">$1</mark>');
  };

  const goToProduct = (slug: string) => {
    router.push('/products/' + slug);
    onClose();
  };

  return (
    /* Overlay: dùng CSS opacity/pointer-events thay vì conditional render → tránh flicker */
    <div
      className={`fixed inset-0 z-[200] transition-opacity duration-200
        ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-w-2xl mx-auto px-6 pt-24">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Đóng tìm kiếm"
        >
          <span className="material-symbols-outlined text-2xl text-gray-500">close</span>
        </button>

        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query) {
                router.push('/search?q=' + encodeURIComponent(query));
                onClose();
              }
            }}
            placeholder="Tìm kiếm sản phẩm, chuyên khoa..."
            className="w-full pl-12 pr-12 py-4 text-xl border-0 border-b-2 border-primary-700
                       bg-transparent focus:outline-none focus:border-primary-500 transition-colors
                       font-body text-text-primary placeholder:text-text-tertiary"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Trending when empty */}
        {query.length === 0 && (
          <div className="mt-8 animate-fade-in">
            <p className="text-sm text-text-secondary mb-3 font-medium">Tìm kiếm phổ biến</p>
            <div className="flex flex-wrap gap-2">
              {['Tim mạch', 'Xương khớp', 'Ngủ ngon', 'Tiêu hóa'].map(t => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="px-4 py-2 rounded-full border border-border text-sm hover:border-primary-500
                             hover:text-primary-700 transition-all duration-150 font-body text-text-secondary"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {query.length >= 1 && isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {query.length >= 1 && !isLoading && results.length > 0 && (
          <ul className="mt-6 divide-y divide-gray-100 animate-fade-in">
            {results.slice(0, 6).map((product: any) => (
              <li key={product.id}>
                <button
                  onClick={() => goToProduct(product.slug)}
                  className="w-full flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-400 text-xl">local_pharmacy</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm text-text-primary"
                      dangerouslySetInnerHTML={{ __html: highlight(product.name, query) }}
                    />
                    <p className="text-xs text-text-secondary mt-0.5">{product.category?.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary-700 flex-shrink-0">
                    {Number(product.variants?.[0]?.price ?? 0).toLocaleString('vi-VN')}đ
                  </p>
                </button>
              </li>
            ))}
            {results.length > 6 && (
              <li className="pt-3 pb-1">
                <button
                  onClick={() => { router.push(`/search?q=${encodeURIComponent(query)}`); onClose(); }}
                  className="text-primary-700 text-sm hover:underline font-medium"
                >
                  Xem tất cả {results.length} kết quả →
                </button>
              </li>
            )}
          </ul>
        )}

        {/* No results */}
        {query.length >= 2 && !isLoading && results.length === 0 && (
          <div className="mt-8 text-center animate-fade-in">
            <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
            <p className="text-text-secondary mt-3">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-text-tertiary mt-1">
              Thử: &ldquo;tim mạch&rdquo;, &ldquo;xương khớp&rdquo;, &ldquo;ngủ ngon&rdquo;...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Navbar ────────────────────────────────────────────────── */
export default function Navbar() {
  const cartCount = useCartCount();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const toast = useToast();
  const { openDrawer } = useCartStore();

  /* States */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  /* Announcement bar — sessionStorage để tránh SSR hydration mismatch */
  useEffect(() => {
    const hidden = sessionStorage.getItem('hide-announcement');
    if (!hidden) setShowAnnounce(true);
  }, []);

  const closeAnnounce = () => {
    sessionStorage.setItem('hide-announcement', '1');
    setShowAnnounce(false);
  };

  /* Backdrop blur khi scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Đóng account dropdown khi click ra ngoài */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Khóa scroll body khi mobile sidebar mở */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = useCallback(async () => {
    setAccountOpen(false);
    await logout();
    toast.success('Đã đăng xuất thành công');
    router.push('/login');
  }, [logout, toast, router]);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* ── Announcement Bar ─────────────────────────────────── */}
      <div
        className={`relative bg-primary-700 text-white text-sm text-center transition-all duration-300 overflow-hidden
          ${showAnnounce ? 'h-10 opacity-100' : 'h-0 opacity-0'}`}
      >
        <div className="flex items-center justify-center h-10 px-10">
          <span>🌿 Miễn phí vận chuyển đơn từ <strong>500.000đ</strong> | Hotline tư vấn: <strong>1800-xxxx</strong></span>
        </div>
        <button
          onClick={closeAnnounce}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-800 rounded-full transition-colors"
          aria-label="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-base leading-none">close</span>
        </button>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        id="main-header"
        className={`sticky top-0 w-full z-50 transition-all duration-300
          ${scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md'
            : 'bg-white border-b border-border'}`}
      >
        <div className="flex items-center justify-between h-16 md:h-16 px-4 md:px-10 max-w-[1280px] mx-auto">

          {/* LEFT: Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Mở menu"
            >
              <span className="material-symbols-outlined text-primary-700 text-2xl">menu</span>
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <span
                className="material-symbols-outlined text-primary-700 text-3xl group-hover:scale-110 transition-transform duration-200"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                eco
              </span>
              <span className="font-display font-bold text-xl text-primary-700 tracking-tight">
                LocHerbal
              </span>
            </Link>
          </div>

          {/* CENTER: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
            <Link
              href="/"
              className="px-4 py-2 rounded-full text-sm font-medium text-text-primary hover:text-primary-700 hover:bg-primary-50 transition-all duration-150"
            >
              Trang chủ
            </Link>

            {/* Sản phẩm — Mega Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-text-primary
                           hover:text-primary-700 hover:bg-primary-50 transition-all duration-150"
              >
                Sản phẩm
                <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:rotate-180">
                  expand_more
                </span>
              </button>

              {/* Mega Dropdown: CSS :hover — không cần state, không flicker */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3
                              invisible opacity-0 group-hover:visible group-hover:opacity-100
                              pointer-events-none group-hover:pointer-events-auto
                              transition-all duration-200 ease-out
                              translate-y-1 group-hover:translate-y-0">
                <div className="bg-white rounded-2xl shadow-xl border border-border p-6 w-[700px]">
                  <div className="grid grid-cols-4 gap-4">
                    {MEGA_CATEGORIES.map(cat => (
                      <div key={cat.name}>
                        {/* Category header */}
                        <Link
                          href={cat.href}
                          className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${cat.gradient}
                                     hover:shadow-sm transition-all duration-200 mb-3 group/cat`}
                        >
                          <span className={`material-symbols-outlined text-xl ${cat.iconColor}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}>
                            {cat.icon}
                          </span>
                          <span className="font-semibold text-sm text-text-primary group-hover/cat:text-primary-700 transition-colors">
                            {cat.name}
                          </span>
                        </Link>

                        {/* Product suggestions */}
                        <ul className="space-y-1">
                          {cat.products.map(p => (
                            <li key={p.slug}>
                              <Link
                                href={`/products/${p.slug}`}
                                className="block text-sm text-text-secondary hover:text-primary-700 hover:translate-x-1
                                           transition-all duration-150 py-1 px-2 rounded-lg hover:bg-primary-50"
                              >
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={cat.href}
                          className="mt-2 text-xs text-primary-600 font-medium hover:underline flex items-center gap-0.5 px-2"
                        >
                          Xem tất cả
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {['Tư vấn', 'Ưu đãi', 'Về chúng tôi'].map(label => (
              <button
                key={label}
                type="button"
                className="px-4 py-2 rounded-full text-sm font-medium text-text-primary hover:text-primary-700 hover:bg-primary-50 transition-all duration-150"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* RIGHT: Search, Cart, Account */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-primary-50 rounded-full transition-colors text-text-secondary hover:text-primary-700"
              aria-label="Tìm kiếm"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              onClick={(e) => {
                if (window.innerWidth >= 768) {
                  e.preventDefault();
                  openDrawer();
                }
              }}
              className="relative p-2 hover:bg-primary-50 rounded-full transition-colors text-text-secondary hover:text-primary-700"
              aria-label={`Giỏ hàng (${cartCount} sản phẩm)`}
            >
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-600 text-white text-[10px]
                             rounded-full flex items-center justify-center font-bold animate-bounce-in"
                  data-testid="cart-count"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div ref={accountRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border
                             hover:border-primary-300 hover:bg-primary-50 transition-all duration-150"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-700 text-white text-xs font-bold
                                  flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-text-primary max-w-[100px] truncate">
                    {user.fullName?.split(' ').pop() || user.email}
                  </span>
                  <span className="material-symbols-outlined text-sm text-text-secondary">expand_more</span>
                </button>

                {/* Account dropdown */}
                <div className={`absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-lg
                                py-2 z-[70] transition-all duration-150 origin-top-right
                                ${accountOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-text-primary truncate">{user.fullName}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    Tài khoản của tôi
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">package_2</span>
                    Đơn hàng của tôi
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary-700 text-white
                           text-sm font-medium hover:bg-primary-800 transition-all duration-150 shadow-sm hover:shadow"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar ───────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Panel — CSS transform thay vì conditional render */}
      <div
        data-testid="mobile-sidebar"
        className={`fixed top-0 left-0 h-full w-72 bg-white z-[110] shadow-xl flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-700 text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="font-display font-bold text-lg text-primary-700">LocHerbal</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng menu"
          >
            <span className="material-symbols-outlined text-text-secondary">close</span>
          </button>
        </div>

        {/* User info (if logged in) */}
        {user && (
          <div className="px-5 py-3 bg-primary-50 border-b border-primary-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-700 text-white font-bold flex items-center justify-center text-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{user.fullName}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {[
            { href: '/', label: 'Trang chủ', icon: 'home' },
            { href: '/products', label: 'Danh mục', icon: 'category', testId: 'nav-categories' },
            { href: '/products?categoryId=tim-mach', label: 'Tim Mạch', icon: 'favorite', sub: true },
            { href: '/products?categoryId=xuong-khop', label: 'Xương Khớp', icon: 'accessibility_new', sub: true },
            { href: '/products?categoryId=tieu-hoa', label: 'Tiêu Hóa', icon: 'local_florist', sub: true },
            { href: '/products?categoryId=an-than-ngu-ngon', label: 'An Thần', icon: 'bedtime', sub: true },
            { href: '/cart', label: 'Giỏ hàng', icon: 'shopping_cart' },
            { href: '/account', label: 'Tài khoản', icon: 'person' },
          ].map(({ href, label, icon, testId, sub }) => (
            <Link
              key={href + label}
              href={href}
              data-testid={testId}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150
                ${sub
                  ? 'ml-4 text-sm text-text-secondary hover:text-primary-700 hover:bg-primary-50'
                  : 'font-medium text-text-primary hover:text-primary-700 hover:bg-primary-50'}`}
            >
              <span className={`material-symbols-outlined ${sub ? 'text-base' : 'text-xl'} ${sub ? 'text-primary-400' : 'text-primary-600'}`}>
                {icon}
              </span>
              {label}
              {href === '/cart' && cartCount > 0 && (
                <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar footer */}
        {user ? (
          <div className="p-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-error
                         hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-border">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Đăng nhập / Đăng ký
            </Link>
          </div>
        )}
      </div>

      {/* ── Bottom Nav Bar (Mobile Only) ─────────────────────── */}
      <nav
        className="fixed bottom-0 w-full z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-border
                   shadow-lg flex justify-around items-center h-16 safe-area-inset-bottom"
        aria-label="Điều hướng mobile"
      >
        {[
          { href: '/', label: 'Trang chủ', icon: 'home' },
          { href: '/products', label: 'Danh mục', icon: 'category' },
          { href: '#search', label: 'Tìm kiếm', icon: 'search', action: () => setSearchOpen(true) },
          { href: '/cart', label: 'Giỏ hàng', icon: 'shopping_cart', badge: cartCount },
          { href: user ? '/account' : '/login', label: user ? 'Tài khoản' : 'Đăng nhập', icon: user ? 'person' : 'login' },
        ].map(({ href, label, icon, badge, action }) =>
          action ? (
            <button
              key={label}
              type="button"
              onClick={action}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-text-secondary
                         hover:text-primary-700 transition-colors active:scale-90 transform duration-100"
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 relative
                         text-text-secondary hover:text-primary-700 transition-colors active:scale-90 transform duration-100"
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1.5 right-2 w-4 h-4 bg-primary-600 text-white text-[9px]
                                 rounded-full flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        )}
      </nav>

      {/* ── Search Overlay ───────────────────────────────────── */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}