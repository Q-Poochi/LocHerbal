'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartCount } from '../../../lib/hooks/useProducts';
import { useAuthStore } from '../../../lib/store/auth.store';
import { apiClient } from '../../../lib/api/client';

export default function Navbar() {
  const cartCount = useCartCount();
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push('/login');
  };

  const accountButton = user ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="hidden md:flex items-center gap-2 cursor-pointer border border-outline-variant px-3 py-1.5 rounded-full hover:bg-surface-container-low transition-all"
      >
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
        <span className="font-label-bold text-label-bold">{user.fullName || user.email}</span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-surface-white border border-outline-variant rounded-lg shadow-lg py-2 z-[70]">
          <div className="px-4 py-2 text-body-sm text-on-surface-variant border-b border-outline-variant">{user.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-body-sm text-error-alert hover:bg-surface-container-low transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link href="/login" className="hidden md:flex items-center gap-2 cursor-pointer border border-outline-variant px-3 py-1.5 rounded-full hover:bg-surface-container-low transition-all">
      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
      <span className="font-label-bold text-label-bold">Tài khoản</span>
    </Link>
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchOpen]);

  const mobileAccount = user ? (
    <button
      type="button"
      onClick={() => { setMenuOpen(false); handleLogout(); }}
      className="flex flex-col items-center text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container-low transition-transform active:scale-90"
    >
      <span className="material-symbols-outlined">logout</span>
      <span className="text-[10px]">Đăng xuất</span>
    </button>
  ) : (
    <Link className="flex flex-col items-center text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container-low transition-transform active:scale-90" href="/login">
      <span className="material-symbols-outlined">person</span>
      <span className="text-[10px]">Tài khoản</span>
    </Link>
  );

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary-container text-on-primary py-2 px-margin-mobile text-center text-body-sm font-medium z-[60] relative">
        🌿 Miễn phí vận chuyển đơn từ 500K | Hotline tư vấn: 1800-xxxx
      </div>

      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-surface dark:bg-surface-container-high shadow-sm transition-all duration-300" id="main-header">
        <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-4">
            <span
              className="material-symbols-outlined text-primary text-3xl cursor-pointer"
              data-testid="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
            >
              menu
            </span>
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed">LocHerbal</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-secondary dark:text-secondary-fixed-dim font-bold font-label-bold text-label-bold transition-colors" href="/">Trang chủ</Link>
            <Link className="text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:text-secondary transition-colors" href="/products">Danh mục</Link>
            <button type="button" className="text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:text-secondary transition-colors">Tư vấn</button>
            <button type="button" className="text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:text-secondary transition-colors">Ưu đãi</button>
            <button type="button" className="text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:text-secondary transition-colors">Về chúng tôi</button>
          </nav>

          <div className="flex items-center gap-4 md:gap-6">
            <div ref={searchRef} className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSearchOpen((v) => !v); }}
                className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
              >
                search
              </button>
              {searchOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 bg-white shadow-xl border border-outline-variant rounded-lg p-4 z-[60] w-[90vw] md:w-[400px] mt-2">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={async (e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        try {
                          const res = await apiClient.get('/products', {
                            params: { search: e.target.value, limit: 5 },
                          });
                          setSuggestions(res.data?.data ?? res.data ?? []);
                        } catch {
                          setSuggestions([]);
                        }
                      } else {
                        setSuggestions([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        router.push('/search?q=' + searchQuery);
                        setSearchOpen(false);
                        setSearchQuery('');
                        setSuggestions([]);
                      }
                    }}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2 outline-none focus:border-primary"
                    autoFocus
                  />
                  {suggestions.length > 0 && (
                    <ul className="mt-2 border border-outline-variant rounded-lg overflow-hidden">
                      {suggestions.map((product: any) => (
                        <li
                          key={product.id}
                          className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex items-center gap-3"
                          onClick={() => {
                            router.push('/products/' + product.slug);
                            setSearchOpen(false);
                            setSearchQuery('');
                            setSuggestions([]);
                          }}
                        >
                          <span className="font-medium text-body-sm line-clamp-1">{product.name}</span>
                          <span className="text-sm text-on-surface-variant ml-auto">
                            {Number(product.variants?.[0]?.price ?? 0).toLocaleString('vi-VN')}₫
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Link href="/cart" className="relative cursor-pointer group">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {accountButton}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          {/* Backdrop - click để đóng */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar panel */}
          <div data-testid="mobile-sidebar" className="fixed top-0 left-0 h-full w-72 bg-surface-white z-50 
                          shadow-xl flex flex-col">

            {/* Header sidebar */}
            <div className="flex items-center justify-between p-4 
                            border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">eco</span>
                <span className="font-headline-lg text-primary font-bold">
                  LocHerbal
                </span>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant 
                           cursor-pointer text-2xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                close
              </span>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col p-4 gap-1 flex-1">
              {[
                { href: '/', label: 'Trang chủ', icon: 'home' },
                { href: '/products', label: 'Danh mục', icon: 'category' },
                { href: '/products?featured=true', label: 'Ưu đãi', icon: 'local_offer' },
                { href: '/account', label: 'Tài khoản', icon: 'person' },
                { href: '/cart', label: 'Giỏ hàng', icon: 'shopping_cart' },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={href === '/products' ? 'nav-categories' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg
                             text-on-surface hover:bg-primary/10 
                             hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                  <span className="font-body-lg">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer sidebar */}
            <div className="p-4 border-t border-gray-100">
              <div className="text-body-sm text-on-surface-variant text-center">
                🌿 Thảo dược thiên nhiên • Chăm sóc sức khỏe
              </div>
            </div>
          </div>
        </>
      )}

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden border-t border-outline-variant dark:border-outline bg-surface dark:bg-surface-container-high shadow-lg flex justify-around items-center h-16">
        <Link className="flex flex-col items-center text-primary dark:text-primary-fixed-dim font-label-bold text-label-bold" href="/">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px]">Trang chủ</span>
        </Link>
        <Link className="flex flex-col items-center text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container-low transition-transform active:scale-90" href="/products">
          <span className="material-symbols-outlined">category</span>
          <span className="text-[10px]">Danh mục</span>
        </Link>
        <button type="button" className="flex flex-col items-center text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container-low transition-transform active:scale-90">
          <span className="material-symbols-outlined">medical_services</span>
          <span className="text-[10px]">Tư vấn</span>
        </button>
        <button type="button" className="flex flex-col items-center text-on-surface-variant dark:text-on-surface-variant font-label-bold text-label-bold hover:bg-surface-container-low transition-transform active:scale-90">
          <span className="material-symbols-outlined">local_offer</span>
          <span className="text-[10px]">Ưu đãi</span>
        </button>
        {mobileAccount}
      </nav>
    </>
  );
}