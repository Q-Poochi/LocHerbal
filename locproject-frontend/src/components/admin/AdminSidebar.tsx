'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { usePathname } from 'next/navigation';

const menuGroups = [
    {
        label: 'TỔNG QUAN',
        items: [
            { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
        ],
    },
    {
        label: 'BÁN HÀNG',
        items: [
            { href: '/admin/orders', icon: 'receipt_long', label: 'Đơn hàng' },
            { href: '/admin/customers', icon: 'group', label: 'Khách hàng' },
        ],
    },
    {
        label: 'SẢN PHẨM',
        items: [
            { href: '/admin/products', icon: 'inventory_2', label: 'Sản phẩm' },
            { href: '/admin/categories', icon: 'category', label: 'Danh mục' },
            { href: '/admin/warehouse', icon: 'warehouse', label: 'Tồn kho' },
        ],
    },
    {
        label: 'NỘI DUNG & KHUYẾN MÃI',
        items: [
            { href: '/admin/hero-banner', icon: 'image', label: 'Ảnh Hero' },
            { href: '/admin/banners', icon: 'view_carousel', label: 'Banner Carousel' },
            { href: '/admin/blog', icon: 'article', label: 'Bài viết' },
            { href: '/admin/coupons', icon: 'sell', label: 'Ưu đãi' },
            { href: '/admin/pages/ve-chung-toi', icon: 'web', label: 'Trang: Về chúng tôi' },
        ],
    },
    {
        label: 'TÀI CHÍNH',
        adminOnly: true,
        items: [
            { href: '/admin/accounting', icon: 'bar_chart', label: 'Doanh thu' },
            { href: '/admin/invoices', icon: 'description', label: 'Hóa đơn' },
        ],
    },
    {
        label: 'VẬN HÀNH',
        items: [
            { href: '/admin/consultations', icon: 'event_available', label: 'Lịch tư vấn' },
            { href: '/admin/support', icon: 'support_agent', label: 'Hỗ trợ' },
        ],
    },
    {
        label: 'HỆ THỐNG',
        adminOnly: true,
        items: [
            { href: '/admin/settings', icon: 'settings', label: 'Cài đặt chung' },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [collapsed, setCollapsed] = useState(false);

    const isAdmin = user?.roles?.includes('admin') ?? user?.role === 'admin';

    const visibleGroups = menuGroups
        .map((group) => ({ ...group, items: group.items }))
        .filter((group) => !group.adminOnly || isAdmin)
        .filter((group) => group.items.length > 0);

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const userRole = isAdmin ? 'Quản trị viên' : 'Nhân viên';

    return (
        <aside
            className={`admin-scroll fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col py-5 overflow-y-auto transition-all z-50 ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Brand */}
            <div className={`mb-6 ${collapsed ? 'px-3 text-center' : 'px-5'}`}>
                {collapsed ? (
                    <div className="w-10 h-10 mx-auto rounded-xl bg-primary-700 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-white text-[22px]">eco</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="material-symbols-outlined text-white text-[22px]">eco</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-[15px] font-bold text-text-primary leading-tight">
                                LocHerbal
                            </h1>
                            <p className="text-[11px] text-text-tertiary leading-tight">
                                Phòng quản trị
                            </p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`mt-3 w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors ${collapsed ? 'mx-auto' : ''
                        }`}
                    aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {collapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>
            </div>

            {/* User card */}
            {!collapsed && (
                <div className="px-4 mb-2">
                    <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-xl border border-border/60">
                        <div className="w-9 h-9 rounded-full bg-primary-700/10 flex items-center justify-center font-semibold text-primary-700 flex-shrink-0">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-text-primary truncate">
                                {user?.fullName || 'Admin'}
                            </span>
                            <span className="inline-flex items-center self-start px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-border text-text-tertiary uppercase tracking-wide">
                                {userRole}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-3 pb-4">
                {visibleGroups.map((group, gi) => (
                    <div key={group.label} className={gi === 0 ? '' : 'mt-1'}>
                        {!collapsed && (
                            <span className="admin-nav-label">{group.label}</span>
                        )}
                        <div className={collapsed ? 'space-y-1' : 'space-y-0.5'}>
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`admin-nav-item ${collapsed ? 'justify-center px-0' : ''} ${isActive(item.href) ? 'active' : ''
                                        }`}
                                >
                                    <span
                                        className="material-symbols-outlined text-[20px]"
                                        style={{
                                            fontVariationSettings: `'FILL' ${isActive(item.href) ? '1' : '0'}`,
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="truncate">{item.label}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="px-3 pb-1 pt-4 border-t border-border">
                {collapsed ? (
                    <button
                        onClick={logout}
                        title="Đăng xuất"
                        className="w-full flex items-center justify-center p-2.5 rounded-lg text-error-alert/70 hover:text-error-alert hover:bg-error-container/40 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                ) : (
                    <button
                        onClick={logout}
                        className="admin-nav-item w-full !text-error-alert/70 hover:!bg-error-container/40 hover:!text-error-alert"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span className="truncate">Đăng xuất</span>
                    </button>
                )}
            </div>
        </aside>
    );
}
