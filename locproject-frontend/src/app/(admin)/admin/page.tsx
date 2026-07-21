import KPICard from '@/components/admin/KPICard';
import RevenueChart from '@/components/admin/RevenueChart';
import RecentOrdersTable from '@/components/admin/RecentOrdersTable';
import StockAlertCard from '@/components/admin/StockAlertCard';
import LeadCard from '@/components/admin/LeadCard';

const kpiData = [
    { title: 'Doanh thu hôm nay', value: '12,450,000 đ', trend: 'up' as const, trendValue: '+15%', icon: 'account_balance_wallet' },
    { title: 'Đơn hàng mới', value: '34', trend: 'up' as const, trendValue: '+8%', icon: 'shopping_bag' },
    { title: 'Khách hàng mới', value: '12', trend: 'down' as const, trendValue: '-3%', icon: 'person_add' },
    { title: 'Tỷ lệ hoàn đơn', value: '2.1%', trend: 'down' as const, trendValue: '-0.5%', icon: 'assignment_return' },
];

const stockAlerts = [
    { productName: 'Trà Dây Túi Lọc', currentStock: 5, threshold: 10, critical: true },
    { productName: 'Hà Thủ Ô Đỏ', currentStock: 8, threshold: 10, critical: false },
];

const leads = [
    { initials: 'TH', name: 'Trần Hùng', phone: '090xxxx123', message: 'Cần tư vấn về bệnh Tim mạch và huyết áp...' },
    { initials: 'MT', name: 'Minh Tuyết', phone: '035xxxx888', message: 'Sản phẩm Cao Gắm có dùng được cho phụ nữ...' },
];

export default async function AdminDashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Top App Bar */}
            <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant h-16 flex justify-between items-center px-8">
                <div className="flex items-center gap-4">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">
                        Bảng điều khiển tổng quan
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors relative">
                        <span className="material-symbols-outlined text-on-surface-variant">
                            notifications
                        </span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-error-alert rounded-full" />
                    </button>
                    <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-bold text-label-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                        <span className="material-symbols-outlined">download</span>
                        Xuất báo cáo
                    </button>
                </div>
            </header>

            {/* Content Canvas */}
            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
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
                    <RecentOrdersTable />

                    {/* Best Selling Products (40%) */}
                    <div className="lg:col-span-4 bg-surface-white p-6 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant">
                        <h4 className="text-headline-md font-bold text-primary mb-6">
                            Sản phẩm bán chạy
                        </h4>
                        <div className="space-y-5">
                            {[
                                { name: 'Sâm Ngọc Linh Cao Cấp', sales: '125', revenue: '45.2M', growth: '+12%' },
                                { name: 'Tinh chất Cao Gắm', sales: '98', revenue: '18.5M', growth: '+5%' },
                                { name: 'Viên nang Bổ Phế', sales: '84', revenue: '12.1M', growth: '+2%' },
                            ].map((product) => (
                                <div
                                    key={product.name}
                                    className="flex items-center gap-4 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-body-sm font-label-bold text-primary truncate">
                                            {product.name}
                                        </h5>
                                        <p className="text-caption text-outline">
                                            {product.sales} lượt bán
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-body-sm font-bold text-secondary">
                                            {product.revenue} đ
                                        </p>
                                        <p className="text-[10px] text-success-leaf font-bold">
                                            {product.growth}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2.5 rounded-lg border border-primary text-primary font-label-bold text-body-sm hover:bg-primary hover:text-on-primary transition-all">
                            Xem báo cáo chi tiết
                        </button>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <StockAlertCard alerts={stockAlerts} />
                    <LeadCard leads={leads} />
                </div>
            </div>
        </div>
    );
}