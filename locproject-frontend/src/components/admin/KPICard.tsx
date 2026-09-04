interface KPICardProps {
    title: string;
    value: string;
    trend: 'up' | 'down';
    trendValue: string;
    icon: string;
}

export default function KPICard({ title, value, trend, trendValue, icon }: KPICardProps) {
    const isUp = trend === 'up';
    const iconBgMap: Record<string, string> = {
        account_balance_wallet: 'bg-primary-50 text-primary-700',
        shopping_bag: 'bg-blue-50 text-blue-600',
        person_add: 'bg-amber-50 text-amber-600',
        assignment_return: 'bg-surface-alt text-text-secondary',
    };

    return (
        <div className="admin-card admin-card-hover p-5">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${iconBgMap[icon] || 'bg-surface-alt text-text-secondary'}`}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </div>
                <div
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${isUp ? 'text-success-leaf bg-success-leaf/10' : 'text-error-alert bg-error-alert/10'}`}
                >
                    <span className="material-symbols-outlined text-[14px]">
                        {isUp ? 'trending_up' : 'trending_down'}
                    </span>
                    {trendValue}
                </div>
            </div>
            <p className="text-text-tertiary text-[13px] mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-text-primary tabular-nums">{value}</h3>
        </div>
    );
}