'use client';

import { useState, useMemo } from 'react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders: number;
    totalSpent: number;
    joinedAt: string;
}

const mockCustomers: Customer[] = [
    { id: '1', name: 'Nguyễn Văn An', email: 'nguyenvana@email.com', phone: '0901 234 567', orders: 12, totalSpent: 15_250_000, joinedAt: '2025-01-15' },
    { id: '2', name: 'Trần Thị Bích', email: 'tranthib@email.com', phone: '0902 345 678', orders: 8, totalSpent: 8_720_000, joinedAt: '2025-03-20' },
    { id: '3', name: 'Lê Hoàng Cường', email: 'lehoangc@email.com', phone: '0903 456 789', orders: 3, totalSpent: 2_150_000, joinedAt: '2025-06-10' },
    { id: '4', name: 'Phạm Minh Đức', email: 'phamminhd@email.com', phone: '0904 567 890', orders: 25, totalSpent: 32_400_000, joinedAt: '2024-09-05' },
    { id: '5', name: 'Hoàng Kim Ngân', email: 'hoangkimngan@email.com', phone: '0905 678 901', orders: 18, totalSpent: 21_680_000, joinedAt: '2024-11-12' },
    { id: '6', name: 'Vũ Thanh Hải', email: 'vuthanhhai@email.com', phone: '0906 789 012', orders: 6, totalSpent: 5_430_000, joinedAt: '2025-05-22' },
    { id: '7', name: 'Đặng Thu Hà', email: 'dangthuha@email.com', phone: '0907 890 123', orders: 10, totalSpent: 11_200_000, joinedAt: '2025-02-14' },
    { id: '8', name: 'Bùi Quốc Bảo', email: 'buiquocbao@email.com', phone: '0908 901 234', orders: 4, totalSpent: 3_850_000, joinedAt: '2025-07-01' },
    { id: '9', name: 'Đỗ Thị Mai', email: 'dothimai@email.com', phone: '0909 012 345', orders: 15, totalSpent: 18_900_000, joinedAt: '2024-12-01' },
    { id: '10', name: 'Lý Hoàng Nam', email: 'lyhoangnam@email.com', phone: '0910 123 456', orders: 7, totalSpent: 6_720_000, joinedAt: '2025-04-18' },
];

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const filtered = useMemo(() => {
        if (!search.trim()) return mockCustomers;
        const q = search.toLowerCase();
        return mockCustomers.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
    }, [search]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

    const totalStats = useMemo(() => ({
        total: mockCustomers.length,
        totalOrders: mockCustomers.reduce((s, c) => s + c.orders, 0),
        totalRevenue: mockCustomers.reduce((s, c) => s + c.totalSpent, 0),
    }), []);

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Khách hàng</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Khách hàng</h2>
                <span className="text-body-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">{filtered.length} khách hàng</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Tổng khách hàng', value: totalStats.total, icon: 'group', color: 'bg-primary/10 text-primary' },
                    { label: 'Tổng đơn hàng', value: totalStats.totalOrders, icon: 'shopping_bag', color: 'bg-secondary-container/20 text-secondary' },
                    { label: 'Tổng doanh thu', value: `${totalStats.totalRevenue.toLocaleString('vi-VN')}₫`, icon: 'account_balance_wallet', color: 'bg-green-100 text-green-700' },
                ].map((stat) => (
                    <div key={stat.label} className={`p-5 rounded-xl ${stat.color} flex items-center gap-4`}>
                        <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
                        <div>
                            <p className="text-caption font-bold uppercase opacity-70">{stat.label}</p>
                            <p className="text-[24px] font-bold mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 material-symbols-outlined text-[20px]">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm bg-surface-white transition-all"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary text-white">
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Khách hàng</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Email</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Phone</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Số đơn</th>
                                <th className="px-5 py-4 text-right font-label-bold text-[12px] uppercase tracking-wider">Tổng chi tiêu</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Tham gia</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {paged.map((c) => (
                                <tr key={c.id} className="hover:bg-surface-container-lowest/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[14px]">
                                                {c.name.charAt(0)}
                                            </div>
                                            <span className="font-label-bold text-primary text-body-sm">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{c.email}</td>
                                    <td className="px-5 py-4 text-body-sm font-medium">{c.phone}</td>
                                    <td className="px-5 py-4 text-center text-body-sm font-bold">{c.orders}</td>
                                    <td className="px-5 py-4 text-right text-body-sm font-bold text-primary">{c.totalSpent.toLocaleString('vi-VN')}₫</td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">{new Date(c.joinedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-5 py-4 text-center">
                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors text-caption font-bold">
                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-on-surface-variant text-body-sm">
                                        <span className="material-symbols-outlined text-4xl text-outline mb-3 block">group_off</span>
                                        Không tìm thấy khách hàng nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
                        <p className="text-caption text-on-surface-variant">
                            <span className="font-semibold text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-primary">{Math.min(page * pageSize, filtered.length)}</span> / {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${p === page ? 'bg-primary text-white shadow-sm' : 'hover:bg-white text-on-surface-variant'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
