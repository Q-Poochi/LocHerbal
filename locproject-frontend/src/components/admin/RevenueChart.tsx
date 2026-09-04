'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Line,
    ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/lib/api/client';

interface RevenuePoint {
    date: string;
    revenue: number;
}

export default function RevenueChart() {
    const [data, setData] = useState<RevenuePoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await apiClient.get<RevenuePoint[]>('/admin/dashboard/revenue-by-day', {
                    params: { days: 30 },
                });
                const body = res.data as RevenuePoint[] | { data?: RevenuePoint[] };
                const raw = Array.isArray(body) ? body : (body?.data ?? []);
                setData(raw.map((p) => ({
                    date: p.date,
                    revenue: Number(p.revenue || 0),
                })));
            } catch {
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="admin-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="font-display font-bold text-xl text-text-primary mb-1">
                        Biểu đồ doanh thu
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Dữ liệu phân tích trong 30 ngày gần nhất
                    </p>
                </div>
            </div>
            {loading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                    <span className="text-text-tertiary">Đang tải dữ liệu...</span>
                </div>
            ) : data.length === 0 ? (
                <div className="h-[300px] w-full flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[40px] text-text-tertiary mb-3">monitoring</span>
                    <p className="text-sm text-text-secondary">Chưa có dữ liệu doanh thu.</p>
                </div>
            ) : (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#e7e5df" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#9ca29b' }}
                                tickLine={false}
                                axisLine={false}
                                interval={6}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#9ca29b' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#fff',
                                    border: '1px solid #e7e5df',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    boxShadow: '0 8px 24px -8px rgba(25,28,28,0.14)',
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#1a8a54"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4, fill: '#166b42' }}
                                name="Doanh thu"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
