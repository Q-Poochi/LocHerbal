'use client';

import {
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Line,
    ResponsiveContainer,
} from 'recharts';

const mockData = Array.from({ length: 30 }, (_, i) => ({
    date: `Ngày ${i + 1}`,
    revenue: Math.round(5_000_000 + Math.random() * 15_000_000),
    orders: Math.round(10 + Math.random() * 40),
}));

export default function RevenueChart() {
    return (
        <div className="bg-surface-white p-8 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-headline-md font-bold text-primary mb-1">
                        Biểu đồ doanh thu & đơn hàng
                    </h3>
                    <p className="text-on-surface-variant text-body-sm font-body-sm">
                        Dữ liệu phân tích trong 30 ngày gần nhất
                    </p>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e2dd" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#717973' }}
                            tickLine={false}
                            interval={6}
                        />
                        <YAxis
                            yAxisId="revenue"
                            tick={{ fontSize: 11, fill: '#717973' }}
                            tickLine={false}
                            tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                        />
                        <YAxis
                            yAxisId="orders"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#717973' }}
                            tickLine={false}
                            hide
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e4e2dd',
                                borderRadius: '8px',
                                fontSize: '13px',
                            }}
                        />
                        <Line
                            yAxisId="revenue"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#1b4332"
                            strokeWidth={2}
                            dot={false}
                            name="Doanh thu"
                        />
                        <Line
                            yAxisId="orders"
                            type="monotone"
                            dataKey="orders"
                            stroke="#f6be39"
                            strokeWidth={2}
                            dot={false}
                            name="Đơn hàng"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}