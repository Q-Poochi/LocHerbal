'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { usePathname } from 'next/navigation';

interface NavGroup {
    label: string;
    items: { label: string; icon: string; href: string }[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Tổng quan',
        items: [{ label: 'Dashboard', icon: 'dashboard', href: '/admin' }],
    },
    {
        label: 'Kinh doanh',
        items: [
            { label: 'Đơn hàng', icon: 'shopping_cart', href: '/admin/orders' },
            { label: 'Khách hàng', icon: 'group', href: '#' },
            { label: 'Đại lý/CTV', icon: 'badge', href: '#' },
        ],
    },
    {
        label: 'Sản phẩm',
        items: [
            { label: 'Danh mục', icon: 'category', href: '#' },
            { label: 'Sản phẩm', icon: 'inventory_2', href: '/admin/products' },
            { label: 'Tồn kho', icon: 'warehouse', href: '#' },
        ],
    },
    {
        label: 'Kế toán',
        items: [
            { label: 'Doanh thu', icon: 'payments', href: '#' },
            { label: 'Hóa đơn', icon: 'receipt_long', href: '#' },
        ],
    },
    {
        label: 'Hệ thống',
        items: [
            { label: 'Hỗ trợ', icon: 'help', href: '#' },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const userRole = user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-primary-container text-on-primary-container shadow-md flex flex-col py-6 overflow-y-auto transition-all ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo Section */}
            <div className={`px-6 mb-8 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? (
                    <h1 className="font-headline-md text-headline-md font-bold text-on-primary">LA</h1>
                ) : (
                    <>
                        <h1 className="font-headline-md text-headline-md font-bold text-on-primary">
                            LocHerbal Admin
                        </h1>
                        <p className="font-caption text-on-primary-container opacity-70">
                            Phòng quản trị
                        </p>
                    </>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="mt-2 text-on-primary-container/60 hover:text-on-primary transition-colors"
                >
                    <span className="material-symbols-outlined">
                        {collapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>
            </div>

            {/* User Profile Section */}
            {!collapsed && (
                <div className="px-4 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-on-primary-fixed-variant/10 rounded-xl">
                        <div className="w-10 h-10 rounded-full border-2 border-secondary-container overflow-hidden bg-primary-fixed/30 flex items-center justify-center font-bold text-on-primary">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-label-bold text-label-bold text-on-primary">
                                {user?.fullName || 'Admin'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container uppercase tracking-wider">
                                {userRole}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Groups */}
            <nav className="flex-1 px-2 space-y-6">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <span className="px-4 text-[11px] font-bold uppercase tracking-widest text-on-primary-container opacity-40">
                                {group.label}
                            </span>
                        )}
                        <div className="mt-2 space-y-1">
                            {group.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive(item.href)
                                            ? 'bg-secondary-container/20 text-on-primary active-nav-border'
                                            : 'text-on-primary-container/80 hover:text-on-primary hover:bg-on-primary-fixed-variant/20'
                                        }`}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontVariationSettings: `'FILL' ${isActive(item.href) ? '1' : '0'}`,
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="font-label-bold text-label-bold">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto px-2 space-y-1 border-t border-on-primary-fixed-variant/20 pt-6">
                {!collapsed && (
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 text-error-container/80 hover:text-error-container px-4 py-2.5 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-label-bold text-label-bold">Đăng xuất</span>
                    </button>
                )}
            </div>
        </aside>
    );
}