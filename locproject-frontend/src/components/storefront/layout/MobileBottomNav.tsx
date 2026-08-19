'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart.store';
import { useCart } from '@/lib/hooks/useProducts';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { data: cart } = useCart();

  const cartCount = Array.isArray(cart?.items)
    ? cart.items.reduce((sum: number, item: { qty?: number }) => sum + (item.qty ?? 1), 0)
    : 0;

  /* Don't show on admin pages */
  if (pathname?.startsWith('/admin')) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  const navItems = [
    { href: '/',          icon: 'home',             label: 'Trang chủ' },
    { href: '/products',  icon: 'category',         label: 'Danh mục'  },
    { href: '/search',    icon: 'search',            label: 'Tìm kiếm' },
    { href: '/account',   icon: 'account_circle',   label: 'Tài khoản' },
  ] as const;

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-[100] md:hidden
                 bg-white border-t border-border shadow-[0_-4px_16px_rgba(27,67,50,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-[60px]">

        {/* Home */}
        <Link
          href={navItems[0].href}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px]
            ${isActive(navItems[0].href) ? 'text-primary-700' : 'text-text-tertiary hover:text-text-secondary'}`}
        >
          <span
            className="material-symbols-outlined text-[22px] leading-none"
            style={{ fontVariationSettings: isActive(navItems[0].href) ? "'FILL' 1" : "'FILL' 0" }}
          >
            {navItems[0].icon}
          </span>
          {navItems[0].label}
        </Link>

        {/* Danh mục */}
        <Link
          href={navItems[1].href}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px]
            ${isActive(navItems[1].href) ? 'text-primary-700' : 'text-text-tertiary hover:text-text-secondary'}`}
        >
          <span
            className="material-symbols-outlined text-[22px] leading-none"
            style={{ fontVariationSettings: isActive(navItems[1].href) ? "'FILL' 1" : "'FILL' 0" }}
          >
            {navItems[1].icon}
          </span>
          {navItems[1].label}
        </Link>

        {/* Giỏ hàng — center CTA */}
        <button
          onClick={openDrawer}
          aria-label="Mở giỏ hàng"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px] relative text-text-tertiary hover:text-primary-700"
        >
          {/* Raised pill */}
          <div className="relative -mt-6 w-14 h-14 bg-primary-700 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <span
              className="material-symbols-outlined text-[22px] leading-none text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_cart
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="mt-0.5">Giỏ hàng</span>
        </button>

        {/* Tìm kiếm */}
        <Link
          href={navItems[2].href}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px]
            ${isActive(navItems[2].href) ? 'text-primary-700' : 'text-text-tertiary hover:text-text-secondary'}`}
        >
          <span
            className="material-symbols-outlined text-[22px] leading-none"
            style={{ fontVariationSettings: isActive(navItems[2].href) ? "'FILL' 1" : "'FILL' 0" }}
          >
            {navItems[2].icon}
          </span>
          {navItems[2].label}
        </Link>

        {/* Tài khoản */}
        <Link
          href={navItems[3].href}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors min-h-[44px]
            ${isActive(navItems[3].href) ? 'text-primary-700' : 'text-text-tertiary hover:text-text-secondary'}`}
        >
          <span
            className="material-symbols-outlined text-[22px] leading-none"
            style={{ fontVariationSettings: isActive(navItems[3].href) ? "'FILL' 1" : "'FILL' 0" }}
          >
            {navItems[3].icon}
          </span>
          {navItems[3].label}
        </Link>

      </div>
    </nav>
  );
}
