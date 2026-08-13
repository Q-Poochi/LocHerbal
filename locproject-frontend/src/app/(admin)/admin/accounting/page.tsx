'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface RevenueSummary {
    from: string;
    to: string;
    revenue: number;
    orderCount: number;
}

interface RevenuePoint {
    date: string;
    revenue: number;
}

interface ApiInvoice {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    issuedAt: string;
    order: { id: string; orderCode: string } | null;
}

type PeriodKey = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
    { key: 'quarter', label: 'Quý' },
    { key: 'year', label: 'Năm' },
];

const PERIOD_DAYS: Record<PeriodKey, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
};

function getPeriodRange(period: PeriodKey): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
        case 'week': {
            const day = now.getDay(); // 0 = Chủ nhật
            const diff = day === 0 ? 6 : day - 1; // tuần bắt đầu từ Thứ 2
            from.setDate(from.getDate() - diff);
            break;
        }
        case 'month':
            from.setDate(1);
            break;
        case 'quarter': {
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            from.setMonth(quarterStartMonth, 1);
            break;
        }
        case 'year':
            from.setMonth(0, 1);
            break;
    }
    return { from, to };
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AccountingPage() {
    const [period, setPeriod] = useState<PeriodKey>('week');
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [revenuePoints, setRevenuePoints] = useState<RevenuePoint[]>([]);
    const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const { from, to } = getPeriodRange(period);
            const [revRes, chartRes, invRes] = await Promise.all([
                apiClient.get<RevenueSummary>('/accounting/revenue', { params: { from: from.toISOString(), to: to.toISOString() } }),
                apiClient.get<RevenuePoint[]>('/admin/dashboard/revenue-by-day', { params: { days: PERIOD_DAYS[period] } }),
                apiClient.get<{ data?: ApiInvoice[] }>('/accounting/invoices', { params: { page: 1, limit: 7 } }),
            ]);
            setSummary(revRes.data);
            setRevenuePoints(Array.isArray(chartRes.data) ? chartRes.data : (chartRes.data as { data?: RevenuePoint[] } | null)?.data ?? []);
            setInvoices(invRes.data?.data ?? []);
            setError('');
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải dữ liệu kế toán'));
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        load();
    }, [load]);

    const maxRevenue = revenuePoints.length
        ? Math.max(...revenuePoints.map((p) => Number(p.revenue || 0)))
        : 1;

    const chartData = revenuePoints.map((p, i) => ({
        label: new Date(p.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
        value: Number((p.revenue / 1_000_000).toFixed(1)),
        key: p.date + i,
    }));

    const kpis = [
        {
            label: 'Doanh thu',
            value: summary ? `${(summary.revenue / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tr` : '—',
            sub: summary ? `${summary.orderCount} hóa đơn` : '',
            icon: 'trending_up',
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        { label: 'Hóa đơn', value: summary ? String(summary.orderCount) : '—', sub: '', icon: 'receipt_long', color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Giá trị TB đơn', value: summary && summary.orderCount ? `${Math.round(summary.revenue / summary.orderCount / 1000)}K` : '—', sub: '', icon: 'monitoring', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Phạm vi', value: summary ? `${formatDate(summary.from)} – ${formatDate(summary.to)}` : '—', sub: PERIODS.find((p) => p.key === period)?.label ?? '', icon: 'payments', color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>Tài chính</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Kế toán</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Kế toán</h2>
                <div className="flex items-center gap-1 bg-surface-alt rounded-xl p-0.5 border border-border">
                    {PERIODS.map((p) => (
                        <button key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${period === p.key ? 'bg-white text-primary-700 shadow-sm' : 'text-text-tertiary hover:text-primary-700'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-2xl border border-border p-16 text-center">
                    <span className="text-text-tertiary">Đang tải dữ liệu kế toán...</span>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        {kpis.map((kpi) => (
                            <div key={kpi.label} className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">{kpi.label}</p>
                                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                        <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
                                    </div>
                                </div>
                                <p className="font-display font-bold text-2xl text-text-primary">{kpi.value}</p>
                                <p className="text-xs text-text-tertiary mt-1">{kpi.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart — weekly revenue */}
                        <div className="lg:col-span-2 bg-white rounded-2xl p-7 shadow-sm border border-border">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary-700">bar_chart</span>
                                <h3 className="font-display font-bold text-lg text-text-primary">Doanh thu theo ngày (triệu đồng)</h3>
                            </div>
                            {chartData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48">
                                    <span className="material-symbols-outlined text-[40px] text-text-tertiary mb-2">monitoring</span>
                                    <p className="text-sm text-text-secondary">Chưa có dữ liệu doanh thu.</p>
                                </div>
                            ) : (
                                <div className="flex items-end justify-between gap-4 h-48 pt-2">
                                    {chartData.map((d) => {
                                        const h = (d.value / Math.max(maxRevenue / 1_000_000, 1)) * 100;
                                        return (
                                            <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-text-tertiary">{d.value.toFixed(1)}</span>
                                                <div className="w-full bg-primary-100 rounded-lg relative" style={{ height: '140px' }}>
                                                    <div className="absolute bottom-0 w-full bg-primary-700 rounded-lg transition-all duration-500" style={{ height: `${Math.min(h, 100)}%` }} />
                                                </div>
                                                <span className="text-[11px] font-bold text-text-tertiary">{d.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent invoices */}
                        <div className="bg-white rounded-2xl p-7 shadow-sm border border-border">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary-700">receipt_long</span>
                                <h3 className="font-display font-bold text-lg text-text-primary">Hóa đơn gần đây</h3>
                            </div>
                            {invoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <span className="material-symbols-outlined text-[40px] text-text-tertiary mb-2">receipt_long</span>
                                    <p className="text-sm text-text-secondary">Chưa có hóa đơn.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {invoices.map((inv) => (
                                        <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-text-primary">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-text-tertiary">{inv.order?.orderCode || '—'} · {new Date(inv.issuedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-3">
                                                <p className="text-sm font-bold text-text-primary">{(Number(inv.totalAmount) / 1000).toFixed(0)}K</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}