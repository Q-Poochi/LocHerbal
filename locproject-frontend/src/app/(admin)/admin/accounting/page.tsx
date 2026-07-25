'use client';

import { useState } from 'react';

const dailyRevenue = [
    { label: 'T2', value: 12.5 },
    { label: 'T3', value: 18.3 },
    { label: 'T4', value: 9.8 },
    { label: 'T5', value: 22.1 },
    { label: 'T6', value: 15.6 },
    { label: 'T7', value: 27.4 },
    { label: 'CN', value: 20.9 },
];

const recentTx = [
    { id: 'TX001', order: '#ORD-102', amount: 985000, method: 'VNPAY', date: '24/07 10:30', status: 'SUCCESS' },
    { id: 'TX002', order: '#ORD-101', amount: 450000, method: 'COD', date: '24/07 09:15', status: 'PENDING' },
    { id: 'TX003', order: '#ORD-100', amount: 1250000, method: 'VNPAY', date: '23/07 16:45', status: 'SUCCESS' },
    { id: 'TX004', order: '#ORD-099', amount: 320000, method: 'BANK_TRANSFER', date: '23/07 14:20', status: 'SUCCESS' },
    { id: 'TX005', order: '#ORD-098', amount: 780000, method: 'COD', date: '23/07 11:00', status: 'PENDING' },
    { id: 'TX006', order: '#ORD-097', amount: 2100000, method: 'VNPAY', date: '22/07 18:30', status: 'SUCCESS' },
    { id: 'TX007', order: '#ORD-096', amount: 560000, method: 'BANK_TRANSFER', date: '22/07 10:00', status: 'FAILED' },
];

export default function AccountingPage() {
    const [period] = useState('week');

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>Tài chính</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Kế toán</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Kế toán</h2>
                <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-0.5 border border-outline-variant/30">
                    {['week', 'month', 'quarter', 'year'].map((p) => (
                        <button key={p}
                            onClick={() => { }}
                            className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${period === p ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
                            {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Doanh thu', value: '126,7Tr', sub: '+12.5% so với tuần trước', icon: 'trending_up', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Đơn hàng', value: '184', sub: '23 đơn/ngày', icon: 'receipt_long', color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Giá trị TB đơn', value: '689K', sub: 'Tăng 8.2%', icon: 'stats', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Tiền mặt (COD)', value: '42,3Tr', sub: '33.4% doanh thu', icon: 'payments', color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-caption text-on-surface-variant font-bold uppercase tracking-wider">{kpi.label}</p>
                            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
                            </div>
                        </div>
                        <p className="font-headline-lg text-headline-lg text-primary">{kpi.value}</p>
                        <p className="text-caption text-on-surface-variant mt-1">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart — weekly revenue */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-7 shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                        <h3 className="font-headline-md text-headline-md text-primary">Doanh thu theo ngày (triệu đồng)</h3>
                    </div>
                    <div className="flex items-end justify-between gap-4 h-48 pt-2">
                        {dailyRevenue.map((d) => {
                            const h = (d.value / 28) * 100;
                            return (
                                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-on-surface-variant">{d.value.toFixed(1)}</span>
                                    <div className="w-full bg-primary/10 rounded-lg relative" style={{ height: '140px' }}>
                                        <div className="absolute bottom-0 w-full bg-primary rounded-lg transition-all duration-500" style={{ height: `${h}%` }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-on-surface-variant">{d.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent transactions */}
                <div className="bg-white rounded-2xl p-7 shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">swap_horiz</span>
                        <h3 className="font-headline-md text-headline-md text-primary">Giao dịch gần đây</h3>
                    </div>
                    <div className="space-y-4">
                        {recentTx.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/20 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-body-sm font-label-bold text-primary">{tx.order}</p>
                                    <p className="text-caption text-on-surface-variant">{tx.method} · {tx.date}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-body-sm font-bold">{(tx.amount / 1000).toFixed(0)}K</p>
                                    <span className={`text-[10px] font-bold ${tx.status === 'SUCCESS' ? 'text-green-600' : tx.status === 'FAILED' ? 'text-red-500' : 'text-orange-500'}`}>
                                        {tx.status === 'SUCCESS' ? 'Thành công' : tx.status === 'FAILED' ? 'Thất bại' : 'Chờ xử lý'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
