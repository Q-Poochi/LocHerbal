'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/providers/toast-provider';
import { resolveCartItemImage } from '@/lib/utils/imageUrl';
import { getErrorMessage } from '@/lib/utils/error';

type Tab = 'profile' | 'orders' | 'addresses' | 'password';

interface Order {
    id: string;
    orderCode: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    items?: { productNameSnapshot: string; thumbnail?: string; product?: { product?: { images?: string[] } } }[];
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

interface Province { code: number; name: string }
interface District { code: number; name: string }
interface Ward { code: number; name: string }

const API = 'https://provinces.open-api.vn/api';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const statusColors: Record<string, string> = {
    PENDING: 'bg-secondary-container text-secondary',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
};

export default function AccountPage() {
    const { user, hasHydrated, logout, clearAuth } = useAuthStore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [profileFullName, setProfileFullName] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [profileError, setProfileError] = useState('');
    const toast = useToast();
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordError, setPasswordError] = useState('');

    /* ── Address form ── */
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [addrProvince, setAddrProvince] = useState('');
    const [addrDistrict, setAddrDistrict] = useState('');
    const [addrName, setAddrName] = useState('');
    const [addrPhone, setAddrPhone] = useState('');
    const [addrLine, setAddrLine] = useState('');
    const [addrDefault, setAddrDefault] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);

    /* ── Password form ── */
    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    /* ── Sync profile fields when user loads ── */
    useEffect(() => {
        if (user) {
            setProfileFullName(user.fullName || '');
            setProfilePhone(user.phone || '');
        }
    }, [user]);

    /* ── Redirect if not logged in (CHỈ sau khi zustand hydrate xong) ── */
    useEffect(() => {
        if (hasHydrated && !user) {
            router.replace('/login?redirect=/account');
        }
    }, [hasHydrated, user, router]);

    /* ── Fetch data ── */
    useEffect(() => {
        if (activeTab === 'orders' && user) {
            setOrdersLoading(true);
            apiClient.get('/orders').then(({ data }) => {
                setOrders(data.data || data || []);
            }).catch(() => setOrders([])).finally(() => setOrdersLoading(false));
        } else if (activeTab === 'addresses' && user) {
            setAddressesLoading(true);
            apiClient.get('/customers/addresses').then(({ data }) => {
                setAddresses(data.data || data || []);
            }).catch(() => setAddresses([])).finally(() => setAddressesLoading(false));
        }
    }, [activeTab, user]);

    /* ── Warm up sidebar counters (orders/addresses count) ── */
    useEffect(() => {
        if (!user) return;
        apiClient.get('/orders').then(({ data }) => setOrders(data.data || data || [])).catch(() => setOrders([]));
        apiClient.get('/customers/addresses').then(({ data }) => setAddresses(data.data || data || [])).catch(() => setAddresses([]));
    }, [user]);

    /* ── Load provinces ── */
    useEffect(() => {
        if (showAddressModal) {
            fetch(`${API}/p/`).then((r) => r.json()).then(setProvinces).catch(() => setProvinces([]));
            setAddrProvince(''); setAddrDistrict(''); setAddrName(''); setAddrPhone(''); setAddrLine(''); setAddrDefault(false);
            setDistricts([]); setWards([]);
        }
    }, [showAddressModal]);

    useEffect(() => {
        if (!addrProvince) { setDistricts([]); setWards([]); return }
        fetch(`${API}/p/${addrProvince}?depth=2`).then((r) => r.json()).then((d: { districts?: District[] }) => setDistricts(d.districts || [])).catch(() => setDistricts([]));
        setAddrDistrict(''); setWards([]);
    }, [addrProvince]);

    useEffect(() => {
        if (!addrDistrict) { setWards([]); return }
        fetch(`${API}/d/${addrDistrict}?depth=2`).then((r) => r.json()).then((d: { wards?: Ward[] }) => setWards(d.wards || [])).catch(() => setWards([]));
    }, [addrDistrict]);

    /* ── Handlers ── */
    const handleLogout = async () => {
        await logout();
        clearAuth();
        router.push('/');
    };

    const handleSaveAddress = async () => {
        if (!addrName || !addrPhone || !addrLine || !addrProvince || !addrDistrict) return;
            setSavingAddress(true);
            try {
                const provinceName = provinces.find((p) => String(p.code) === addrProvince)?.name || '';
                const districtName = districts.find((d) => String(d.code) === addrDistrict)?.name || '';
                await apiClient.post('/customers/addresses', {
                    recipientName: addrName,
                    phone: addrPhone,
                    addressLine: addrLine,
                    province: provinceName,
                    district: districtName,
                    isDefault: addrDefault,
                });
                toast.success('Đã lưu địa chỉ mới');
                setShowAddressModal(false);
                const { data } = await apiClient.get('/customers/addresses');
                setAddresses(data.data || data || []);
            } catch { toast.error('Lưu địa chỉ thất bại'); } finally { setSavingAddress(false); }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await apiClient.patch(`/customers/addresses/${id}/default`);
            const { data } = await apiClient.get('/customers/addresses');
            setAddresses(data.data || data || []);
        } catch { }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await apiClient.delete(`/customers/addresses/${id}`);
            toast.success('Đã xóa địa chỉ');
            setAddresses((prev) => prev.filter((a) => a.id !== id));
        } catch { toast.error('Xóa địa chỉ thất bại'); }
    };

    const handleSaveProfile = async () => {
        setProfileMsg('');
        setProfileError('');
        setSavingProfile(true);
        try {
            await apiClient.patch('/auth/profile', { fullName: profileFullName, phone: profilePhone });
            setProfileMsg('Cập nhật thông tin thành công');
        } catch (err) {
            setProfileError(getErrorMessage(err, 'Cập nhật thông tin thất bại'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = passwordForm.handleSubmit(async (data) => {
        setPasswordMsg('');
        setPasswordError('');
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setPasswordMsg('Đổi mật khẩu thành công');
            passwordForm.reset();
        } catch (err) {
            setPasswordError(getErrorMessage(err, 'Đổi mật khẩu thất bại'));
        }
    });

    // Chưa hydrate xong → render spinner, tránh flash-redirect về /login
    if (!hasHydrated) return null;

    if (!user) return null;

    const initials = user.fullName
        ? user.fullName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
        : user.email[0].toUpperCase();

    const menu: { key: Tab | 'logout'; label: string; icon: string }[] = [
        { key: 'profile', label: 'Thông tin cá nhân', icon: 'person' },
        { key: 'orders', label: 'Đơn hàng của tôi', icon: 'inventory_2' },
        { key: 'addresses', label: 'Địa chỉ', icon: 'location_on' },
        { key: 'password', label: 'Đổi mật khẩu', icon: 'lock' },
    ];

    return (
        <div className="max-w-container-max mx-auto w-full min-w-0 px-margin-mobile md:px-margin-desktop py-stack-lg">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-6">Tài khoản của tôi</h1>

            {/* ── Mobile tabs (horizontal scroll) ── */}
            <div className="md:hidden -mx-margin-mobile px-margin-mobile overflow-x-auto mb-4">
                <div className="flex gap-2 min-w-max pb-2">
                    {menu.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => {
                                if (item.key === 'logout') handleLogout();
                                else setActiveTab(item.key as Tab);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-label-bold whitespace-nowrap transition-all ${activeTab === item.key
                                    ? 'bg-primary-100 text-primary-800'
                                    : 'bg-surface-white text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-gutter items-start">
                {/* ── Sidebar (desktop only) ── */}
                <aside className="hidden md:block w-[240px] flex-shrink-0 md:sticky md:top-24">
                    <div className="bg-surface-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 p-6">
                        <div className="flex flex-col items-center text-center mb-4">
                            <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-[24px]">
                                    {initials}
                                </div>
                                <button type="button" title="Đổi ảnh"
                                    className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-surface-white border border-outline-variant flex items-center justify-center text-primary shadow-sm hover:bg-surface-container-low transition-colors">
                                    <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                                </button>
                            </div>
                            <p className="font-label-bold text-label-bold text-primary">{user.fullName}</p>
                            <p className="text-caption text-on-surface-variant mt-0.5">{user.email}</p>
                            <div className="grid grid-cols-2 gap-2 w-full mt-4">
                                <div className="px-2 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center">
                                    <p className="font-label-bold text-label-bold text-primary tabular-nums">{ordersLoading ? '…' : orders.length}</p>
                                    <p className="text-caption text-on-surface-variant">Đơn hàng</p>
                                </div>
                                <div className="px-2 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center">
                                    <p className="font-label-bold text-label-bold text-primary tabular-nums">{addressesLoading ? '…' : addresses.length}</p>
                                    <p className="text-caption text-on-surface-variant">Địa chỉ</p>
                                </div>
                            </div>
                        </div>
                        <hr className="border-outline-variant/30 mb-3" />
                        <nav className="space-y-1">
                            {menu.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        if (item.key === 'logout') handleLogout();
                                        else setActiveTab(item.key as Tab);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm transition-all ${activeTab === item.key
                                            ? 'bg-primary-100 text-primary-800 font-medium'
                                            : 'text-on-surface-variant hover:bg-primary-50 hover:text-primary-800'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                            <hr className="border-outline-variant/30 my-2" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium text-error hover:bg-error-container transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Đăng xuất
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* ── Content ── */}
                <div className="flex-1 w-full min-w-0">
                    {/* ═══ PROFILE ═══ */}
                    {activeTab === 'profile' && (
                        <div className="bg-surface-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 p-8">
                            <h3 className="font-headline-md text-headline-md text-primary mb-6">Thông tin cá nhân</h3>
                            <div className="flex flex-col sm:flex-row items-start gap-8 mb-8">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-[28px]">
                                        {initials}
                                    </div>
                                    <button className="text-caption text-primary font-bold hover:underline" type="button">Đổi ảnh</button>
                                </div>
                                <div className="flex-1 w-full space-y-5">
                                    <div>
                                        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Họ và tên *</label>
                                        <input value={profileFullName} onChange={(e) => setProfileFullName(e.target.value)} className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Nguyễn Văn A" />
                                    </div>
                                    <div>
                                        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Email</label>
                                        <input className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md bg-surface-container-low text-on-surface-variant cursor-not-allowed outline-none" value={user.email} readOnly />
                                        <p className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-success-leaf">
                                            <span className="material-symbols-outlined text-[14px]">verified</span>
                                            Đã xác thực
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Số điện thoại</label>
                                        <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="0901234567" />
                                    </div>
                                    <div>
                                        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Giới tính</label>
                                        <div className="flex items-center gap-6">
                                            {['Nam', 'Nữ', 'Khác'].map((g) => (
                                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="gender" className="w-4 h-4 text-primary accent-primary" />
                                                    <span className="text-body-sm text-on-surface">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Ngày sinh</label>
                                        <input type="date" className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 pt-6 border-t border-outline-variant/30">
                                {profileMsg && <p className="text-success-leaf text-body-sm font-bold text-right">{profileMsg}</p>}
                                {profileError && <p className="text-error text-body-sm text-right">{profileError}</p>}
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => { setProfileFullName(user.fullName || ''); setProfilePhone(user.phone || ''); setProfileMsg(''); setProfileError(''); }}
                                        className="px-8 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-all">
                                        Hủy
                                    </button>
                                    <button onClick={handleSaveProfile} disabled={savingProfile}
                                        className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
                                        {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ ORDERS ═══ */}
                    {activeTab === 'orders' && (
                        <div className="bg-surface-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 p-8">
                            <h3 className="font-headline-md text-headline-md text-primary mb-6">Đơn hàng của tôi</h3>
                            {ordersLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="border border-outline-variant/30 rounded-xl p-5 animate-pulse space-y-3">
                                            <div className="h-5 bg-surface-container rounded w-1/4" />
                                            <div className="h-4 bg-surface-container rounded w-3/4" />
                                            <div className="h-4 bg-surface-container rounded w-1/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="material-symbols-outlined text-5xl text-outline mb-4 block">shopping_bag</span>
                                    <p className="text-body-lg text-on-surface-variant mb-2">Bạn chưa có đơn hàng nào</p>
                                    <p className="text-body-sm text-on-surface-variant mb-6">Hãy khám phá các sản phẩm thảo dược chất lượng cao</p>
                                    <button onClick={() => router.push('/products')}
                                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-bold hover:bg-primary-700 transition-colors">
                                        Bắt đầu mua sắm
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="border border-outline-variant/30 rounded-xl p-5 hover:shadow-sm transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-label-bold text-primary">#{order.orderCode}</span>
                                                    <span className={`px-3 py-0.5 text-[10px] font-bold rounded-full ${statusColors[order.status] || 'bg-surface-container text-on-surface-variant'}`}>
                                                        {statusLabel[order.status] || order.status}
                                                    </span>
                                                </div>
                                                <span className="text-caption text-on-surface-variant">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                {(order.items?.slice(0, 3) || []).map((item, idx) => (
                                                    <div key={idx} className="w-10 h-10 bg-surface-container rounded-lg overflow-hidden flex-shrink-0">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img className="w-full h-full object-cover" src={resolveCartItemImage(item) || ''} alt="" />
                                                    </div>
                                                ))}
                                                <span className="text-body-sm text-on-surface-variant truncate">
                                                    {order.items?.[0]?.productNameSnapshot || ''}
                                                    {(order.items?.length || 0) > 1 ? ` +${(order.items?.length || 0) - 1} sản phẩm khác` : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                                                <span className="font-label-bold text-primary tabular-nums">
                                                    {order.totalAmount?.toLocaleString('vi-VN')}₫
                                                </span>
                                                <button onClick={() => router.push(`/orders/${order.id}`)} className="text-primary font-bold text-caption hover:underline">Xem chi tiết →</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ ADDRESSES ═══ */}
                    {activeTab === 'addresses' && (
                        <div className="bg-surface-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-headline-md text-headline-md text-primary">Địa chỉ của tôi</h3>
                                <button onClick={() => setShowAddressModal(true)}
                                    className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary/20">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Thêm địa chỉ mới
                                </button>
                            </div>
                            {addressesLoading ? (
                                <div className="space-y-3">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="border border-outline-variant/30 rounded-xl p-5 animate-pulse space-y-2">
                                            <div className="h-5 bg-surface-container rounded w-1/3" />
                                            <div className="h-4 bg-surface-container rounded w-2/3" />
                                            <div className="h-4 bg-surface-container rounded w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="material-symbols-outlined text-5xl text-outline mb-4 block">location_on</span>
                                    <p className="text-body-lg text-on-surface-variant mb-1">Chưa có địa chỉ nào</p>
                                    <p className="text-body-sm text-on-surface-variant mb-6">Thêm địa chỉ để thuận tiện cho việc đặt hàng</p>
                                    <button onClick={() => setShowAddressModal(true)}
                                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-bold hover:bg-primary-700 transition-colors">
                                        Thêm địa chỉ mới
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map((addr) => (
                                        <div key={addr.id} className="border border-outline-variant/30 rounded-xl p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-label-bold text-primary">{addr.recipientName}</span>
                                                        {addr.isDefault && (
                                                            <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[10px] font-bold rounded">Mặc định</span>
                                                        )}
                                                    </div>
                                                    <p className="text-body-sm text-on-surface-variant">{addr.phone}</p>
                                                    <p className="text-body-sm text-on-surface-variant">{addr.addressLine}{addr.ward ? `, ${addr.ward}` : ''}{addr.district ? `, ${addr.district}` : ''}, {addr.province}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant/20">
                                                {!addr.isDefault && (
                                                    <button onClick={() => handleSetDefault(addr.id)}
                                                        className="text-caption text-primary font-bold hover:underline">
                                                        Đặt làm mặc định
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteAddress(addr.id)}
                                                    className="text-caption text-error font-bold hover:underline">
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ CHANGE PASSWORD ═══ */}
                    {activeTab === 'password' && (
                        <div className="bg-surface-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 p-8">
                            <h3 className="font-headline-md text-headline-md text-primary mb-6">Đổi mật khẩu</h3>
                            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                                <div>
                                    <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Mật khẩu hiện tại *</label>
                                    <input type="password" {...passwordForm.register('currentPassword')}
                                        className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="••••••••" />
                                    {passwordForm.formState.errors.currentPassword && (
                                        <p className="text-error text-caption mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Mật khẩu mới *</label>
                                    <input type="password" {...passwordForm.register('newPassword')}
                                        className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Tối thiểu 8 ký tự" />
                                    {passwordForm.formState.errors.newPassword && (
                                        <p className="text-error text-caption mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-label-bold text-label-bold text-on-surface-variant mb-1.5">Xác nhận mật khẩu mới *</label>
                                    <input type="password" {...passwordForm.register('confirmPassword')}
                                        className="w-full px-4 py-3 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Nhập lại mật khẩu mới" />
                                    {passwordForm.formState.errors.confirmPassword && (
                                        <p className="text-error text-caption mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                                    )}
                                </div>
                                {passwordMsg && <p className="text-success-leaf text-body-sm font-bold">{passwordMsg}</p>}
                                {passwordError && <p className="text-error text-body-sm">{passwordError}</p>}
                                <button type="submit" disabled={passwordForm.formState.isSubmitting}
                                    className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
                                    {passwordForm.formState.isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Address Modal ── */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddressModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">add_location</span>
                            <h3 className="font-headline-md text-headline-md text-primary">Thêm địa chỉ mới</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Họ tên người nhận *</label>
                                    <input value={addrName} onChange={(e) => setAddrName(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Số điện thoại *</label>
                                    <input value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="0901234567" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Tỉnh/Thành</label>
                                    <select value={addrProvince} onChange={(e) => setAddrProvince(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all">
                                        <option value="">Chọn Tỉnh</option>
                                        {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Quận/Huyện</label>
                                    <select value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} disabled={!addrProvince}
                                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all disabled:opacity-50">
                                        <option value="">Chọn Quận</option>
                                        {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Phường/Xã</label>
                                    <select disabled={!addrDistrict}
                                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all disabled:opacity-50">
                                        <option value="">Chọn Phường</option>
                                        {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Địa chỉ cụ thể *</label>
                                <input value={addrLine} onChange={(e) => setAddrLine(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl font-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Số nhà, tên đường..." />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={addrDefault} onChange={(e) => setAddrDefault(e.target.checked)}
                                    className="w-4 h-4 text-primary accent-primary rounded" />
                                <span className="text-body-sm text-on-surface">Đặt làm địa chỉ mặc định</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button onClick={() => setShowAddressModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors">
                                Hủy
                            </button>
                            <button onClick={handleSaveAddress} disabled={savingAddress}
                                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50">
                                {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
