'use client';

import Navbar from '../../../components/storefront/layout/Navbar';
import Footer from '../../../components/storefront/layout/Footer';
import { useAuthStore } from '../../../lib/store/auth.store';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';

type Tab = 'profile' | 'orders' | 'addresses' | 'logout';

interface Order {
    id: string;
    orderCode: string;
    createdAt: string;
    status: string;
    totalAmount: number;
}

interface Address {
    id: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    ward?: string;
    district?: string;
    province: string;
    isDefault?: boolean;
}

export default function AccountPage() {
    const { user, logout, clearAuth } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch data khi chuyển tab
    useEffect(() => {
        if (activeTab === 'orders' && user) {
            fetchOrders();
        } else if (activeTab === 'addresses' && user) {
            fetchAddresses();
        }
    }, [activeTab, user]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/orders');
            setOrders(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/customers/addresses');
            setAddresses(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        clearAuth();
        router.push('/');
    };

    const getStatusBadgeClass = (status: string) => {
        const classes: Record<string, string> = {
            pending: 'bg-secondary-container text-secondary',
            confirmed: 'bg-primary-container text-primary',
            shipping: 'bg-tertiary text-white',
            delivered: 'bg-success-leaf text-white',
            cancelled: 'bg-error text-white',
        };
        return classes[status] || 'bg-surface-container text-on-surface-variant';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Chờ xử lý',
            confirmed: 'Đã xác nhận',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy',
        };
        return labels[status] || status;
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <main className="w-full py-20">
                    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-[48px] text-outline mb-4">person_off</span>
                            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Chưa đăng nhập</h2>
                            <p className="text-body-md text-on-surface-variant mb-6">Vui lòng đăng nhập để xem thông tin tài khoản</p>
                            <a href="/login" className="inline-block py-2.5 px-6 bg-primary text-white rounded-lg font-label-bold text-body-sm hover:bg-primary-container transition-colors">
                                Đăng nhập
                            </a>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="w-full py-8">
                <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
                    <h1 className="font-headline-lg text-headline-lg text-primary mb-6">Tài khoản của tôi</h1>

                    <div className="flex flex-col md:flex-row gap-gutter">
                        {/* Sidebar Menu */}
                        <aside className="w-full md:w-[240px] flex-shrink-0">
                            <nav className="bg-surface-white rounded-xl shadow-soft p-4 space-y-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-label-bold text-body-sm transition-colors flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">person</span>
                                    Thông tin cá nhân
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-label-bold text-body-sm transition-colors flex items-center gap-3 ${activeTab === 'orders' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">shopping_bag</span>
                                    Đơn hàng
                                </button>
                                <button
                                    onClick={() => setActiveTab('addresses')}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-label-bold text-body-sm transition-colors flex items-center gap-3 ${activeTab === 'addresses' ? 'bg-primary-container text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">location_on</span>
                                    Địa chỉ
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 rounded-lg font-label-bold text-body-sm text-error hover:bg-error-container transition-colors flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    Đăng xuất
                                </button>
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Tab: Thông tin cá nhân */}
                            {activeTab === 'profile' && (
                                <div className="bg-surface-white rounded-xl shadow-soft p-6">
                                    <h3 className="font-headline-md text-headline-md text-primary mb-4">Thông tin cá nhân</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-caption text-outline block mb-1">Họ và tên</label>
                                            <p className="text-body-lg text-primary font-medium">{user.fullName || 'Chưa cập nhật'}</p>
                                        </div>
                                        <div>
                                            <label className="text-caption text-outline block mb-1">Email</label>
                                            <p className="text-body-lg text-primary font-medium">{user.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-caption text-outline block mb-1">Số điện thoại</label>
                                            <p className="text-body-lg text-primary font-medium">{user.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <button className="mt-6 py-2.5 px-6 bg-primary text-white rounded-lg font-label-bold text-body-sm hover:bg-primary-container transition-colors">
                                        Chỉnh sửa
                                    </button>
                                </div>
                            )}

                            {/* Tab: Đơn hàng */}
                            {activeTab === 'orders' && (
                                <div className="bg-surface-white rounded-xl shadow-soft p-6">
                                    <h3 className="font-headline-md text-headline-md text-primary mb-4">Đơn hàng của tôi</h3>
                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="border border-outline-variant rounded-lg p-4 animate-pulse">
                                                    <div className="h-5 bg-surface-container rounded w-1/3 mb-2" />
                                                    <div className="h-4 bg-surface-container rounded w-1/4 mb-2" />
                                                    <div className="h-4 bg-surface-container rounded w-1/2" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-[48px] text-outline mb-4">shopping_bag</span>
                                            <p className="text-body-md text-on-surface-variant">Bạn chưa có đơn hàng nào</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {orders.map((order) => (
                                                <div key={order.id} className="border border-outline-variant rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`px-3 py-1 rounded-full text-caption font-bold ${getStatusBadgeClass(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                        <span className="text-body-sm text-outline">#{order.orderCode}</span>
                                                    </div>
                                                    <div className="flex justify-between text-body-sm">
                                                        <span className="text-on-surface-variant">Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                        <span className="text-primary font-bold">{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Địa chỉ */}
                            {activeTab === 'addresses' && (
                                <div className="bg-surface-white rounded-xl shadow-soft p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-headline-md text-headline-md text-primary">Địa chỉ của tôi</h3>
                                        <button className="py-2 px-4 bg-primary text-white rounded-lg font-label-bold text-body-sm hover:bg-primary-container transition-colors flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                            Thêm địa chỉ mới
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: 2 }).map((_, i) => (
                                                <div key={i} className="border border-outline-variant rounded-lg p-4 animate-pulse">
                                                    <div className="h-5 bg-surface-container rounded w-1/3 mb-2" />
                                                    <div className="h-4 bg-surface-container rounded w-2/3 mb-2" />
                                                    <div className="h-4 bg-surface-container rounded w-1/2" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-[48px] text-outline mb-4">location_off</span>
                                            <p className="text-body-md text-on-surface-variant">Chưa có địa chỉ nào</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {addresses.map((address) => (
                                                <div key={address.id} className="border border-outline-variant rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-label-bold text-body-md text-primary">{address.recipientName}</h4>
                                                                {address.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-primary-container text-primary text-caption rounded">Mặc định</span>
                                                                )}
                                                            </div>
                                                            <p className="text-body-sm text-on-surface-variant">{address.phone}</p>
                                                            <p className="text-body-sm text-on-surface-variant">{address.addressLine}, {address.ward}, {address.district}, {address.province}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}