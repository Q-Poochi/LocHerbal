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
        account_balance_wallet: 'bg-primary-fixed/30',
        shopping_bag: 'bg-secondary-container/20',
        person_add: 'bg-tertiary-fixed/30',
        assignment_return: 'bg-surface-container-high',
    };

    return (
        <div className="bg-surface-white p-6 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 ${iconBgMap[icon] || 'bg-surface-container-low'} rounded-lg`}>
                    <span className="material-symbols-outlined text-primary-container">{icon}</span>
                </div>
                <div
                    className={`flex items-center gap-1 font-label-bold text-caption px-2 py-0.5 rounded-full ${isUp ? 'text-success-leaf bg-success-leaf/10' : 'text-error-alert bg-error-alert/10'}`}
                >
                    <span className="material-symbols-outlined text-[14px]">
                        {isUp ? 'trending_up' : 'trending_down'}
                    </span>
                    {trendValue}
                </div>
            </div>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-1">{title}</p>
            <h3 className="text-headline-md font-bold text-primary">{value}</h3>
        </div>
    );
}