'use client';

import { useEffect, useState } from 'react';
import KPICard from '@/components/admin/KPICard';
import RevenueChart from '@/components/admin/RevenueChart';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';
import StockAlertCard, { StockAlert } from '@/components/admin/StockAlertCard';
import LeadCard from '@/components/admin/LeadCard';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface RecentOrder {
    id: string;
    orderCode: string;
    customer: { fullName?: string; email?: string } | null;
    totalAmount: number;
    status: string;
    paymentStatus: string;
}

interface DashboardStats {
    revenue: { total: number; today: number };
    orders: { total: number; today: number };
    totalCustomers: number;
    totalProducts: number;
    lowStockItems: number;
    recentOrders: RecentOrder[];
}

interface TopProduct {
    productVariantId: string;
    totalSold: number;
    variant: { id: string; name: string; product: { name: string; slug: string } } | null;
}

interface StockItem {
    id: string;
    warehouse: { id: string; name: string } | null;
    variant: { id: string; sku: string; name: string; product: { id: string; name: string } } | null;
    qtyOnHand: number;
    qtyReserved: number;
    available: number;
    reorderThreshold: number;
    isLowStock: boolean;
}

interface StockOverviewResponse {
    data: StockItem[];
    total: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchAll() {
            try {
                const [statsRes, topRes, stockRes] = await Promise.all([
                    apiClient.get<DashboardStats>('/admin/dashboard/stats'),
                    apiClient.get<unknown>('/admin/dashboard/top-products', { params: { limit: 5 } }),
                    apiClient.get<StockOverviewResponse>('/admin/warehouse/stock', { params: { page: 1, limit: 100 } }),
                ]);
                setStats(statsRes.data);
                const topBody = topRes.data as TopProduct[] | { data?: TopProduct[] };
                setTopProducts(Array.isArray(topBody) ? topBody : topBody?.data ?? []);

                const items = stockRes.data?.data ?? [];
                setStockAlerts(
                    items
                        .filter((s) => s.isLowStock)
                        .map((s) => ({
                            productName: s.variant?.product.name || s.variant?.name || 'Sản phẩm',
                            currentStock: s.available,
                            threshold: s.reorderThreshold,
                            critical: s.available <= 1,
                        }))
                        .sort((a, b) => a.currentStock - b.currentStock),
                );
            } catch (e) {
                setError(getErrorMessage(e, 'Không thể tải dữ liệu dashboard'));
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const exportReport = () => {
        if (!stats) return;

        const rows: string[][] = [];
        rows.push(['LOC-HERBAL BAO CAO TONG QUAN', '']);
        rows.push(['Ngay xuat', new Date().toLocaleString('vi-VN')]);
        rows.push(['']);
        rows.push(['CHI SO TONG QUAN', '']);
        rows.push(['Doanh thu hom nay', `${stats.revenue.today.toLocaleString('vi-VN')} VND`]);
        rows.push(['Tong doanh thu', `${stats.revenue.total.toLocaleString('vi-VN')} VND`]);
        rows.push(['Don hang hom nay', String(stats.orders.today)]);
        rows.push(['Tong so don hang', String(stats.orders.total)]);
        rows.push(['Khach hang', String(stats.totalCustomers)]);
        rows.push(['San pham', String(stats.totalProducts)]);
        rows.push(['San pham sap het hang', String(stats.lowStockItems)]);
        rows.push(['']);

        if (topProducts.length > 0) {
            rows.push(['SAN PHAM BAN CHAY', '']);
            rows.push(['Ten san pham', 'So luot ban']);
            topProducts.forEach((p) =>
                rows.push([p.variant?.product.name || p.variant?.name || 'San pham', String(p.totalSold)])
            );
            rows.push(['']);
        }

        if (stats.recentOrders.length > 0) {
            rows.push(['DON HANG GAN DAY', '']);
            rows.push(['Ma don', 'Khach hang', 'Tong tien (VND)', 'Trang thai', 'Thanh toan']);
            stats.recentOrders.forEach((o: RecentOrder) =>
                rows.push([
                    o.orderCode || o.id || '',
                    o.customer?.fullName || o.customer?.email || '',
                    Number(o.totalAmount ?? 0).toLocaleString('vi-VN'),
                    o.status || '',
                    o.paymentStatus || '',
                ])
            );
        }

        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-tong-quan-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const kpiData = stats ? [
        { title: 'Doanh thu hôm nay', value: `${(stats.revenue.today / 1000).toLocaleString('vi-VN')}K đ`, trend: stats.revenue.today >= 0 ? 'up' as const : 'down' as const, trendValue: '+15%', icon: 'account_balance_wallet' },
        { title: 'Đơn hàng mới', value: String(stats.orders.today), trend: 'up' as const, trendValue: '+8%', icon: 'shopping_bag' },
        { title: 'Khách hàng', value: String(stats.totalCustomers), trend: 'down' as const, trendValue: '0%', icon: 'person_add' },
        { title: 'Sản phẩm', value: String(stats.totalProducts), trend: 'up' as const, trendValue: '0%', icon: 'assignment_return' },
    ] : [];

    return (
        <div className="min-h-screen bg-background">
            {/* Top App Bar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border h-16 flex justify-between items-center px-8">
                <div className="flex items-center gap-4">
                    <h2 className="font-display font-bold text-xl text-text-primary">
                        Bảng điều khiển tổng quan
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors relative">
                        <span className="material-symbols-outlined text-text-secondary">
                            notifications
                        </span>
                        {stats && stats.lowStockItems > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={exportReport}
                        className="bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Xuất báo cáo
                    </button>
                </div>
            </header>

            {/* Content Canvas */}
            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <span className="text-text-tertiary">Đang tải dữ liệu...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
                        <p className="text-text-secondary font-medium">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {kpiData.map((kpi) => (
                                <KPICard key={kpi.title} {...kpi} />
                            ))}
                        </div>

                        {/* Revenue Chart */}
                        <RevenueChart />

                        {/* Two-Column Mid Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                            <RecentOrdersTable orders={stats?.recentOrders ?? []} />

                            {/* Best Selling Products (40%) */}
                            <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-border">
                                <h4 className="font-display font-bold text-lg text-text-primary mb-6">
                                    Sản phẩm bán chạy
                                </h4>
                                {topProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <span className="material-symbols-outlined text-[40px] text-text-tertiary mb-3">trending_up</span>
                                        <p className="text-sm text-text-secondary">Chưa có dữ liệu sản phẩm bán chạy.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {topProducts.map((item) => (
                                            <div
                                                key={item.productVariantId}
                                                className="flex items-center gap-4 group cursor-pointer"
                                            >
                                                <div className="w-12 h-12 bg-surface-alt rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary-200">local_pharmacy</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-semibold text-text-primary truncate">
                                                        {item.variant?.product.name || item.variant?.name || 'Sản phẩm'}
                                                    </h5>
                                                    <p className="text-xs text-text-tertiary">
                                                        {item.totalSold} lượt bán
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button className="w-full mt-6 py-2.5 rounded-lg border border-primary-700 text-primary-700 font-semibold text-sm hover:bg-primary-700 hover:text-white transition-all">
                                    Xem báo cáo chi tiết
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <StockAlertCard alerts={stockAlerts} />
                            <LeadCard leads={[]} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
