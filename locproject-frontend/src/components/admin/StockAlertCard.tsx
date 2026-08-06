export interface StockAlert {
    productName: string;
    currentStock: number;
    threshold: number;
    critical?: boolean;
}

interface StockAlertCardProps {
    alerts: StockAlert[];
}

export default function StockAlertCard({ alerts }: StockAlertCardProps) {
    const criticalCount = alerts.filter((a) => a.critical).length;

    return (
        <div className="bg-surface-white p-6 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error-alert">warning</span>
                    <h4 className="text-headline-md font-bold text-primary">Cảnh báo tồn kho</h4>
                </div>
                {criticalCount > 0 && (
                    <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full">
                        {criticalCount} Cần nhập gấp
                    </span>
                )}
            </div>
            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-[36px] text-outline mb-3">inventory_2</span>
                        <p className="text-body-sm font-semibold text-primary">Tồn kho đang ổn định</p>
                        <p className="text-caption text-outline mt-1">Không có sản phẩm nào dưới ngưỡng cảnh báo.</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.productName}
                            className={`flex items-center justify-between p-3 rounded-lg border ${alert.critical
                                    ? 'border-error-container bg-error-container/5'
                                    : 'border-outline-variant'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`material-symbols-outlined text-[32px] ${alert.critical ? 'text-error-alert' : 'text-outline'
                                        }`}
                                >
                                    inventory
                                </span>
                                <div>
                                    <p className="font-label-bold text-body-sm text-primary">
                                        {alert.productName}
                                    </p>
                                    <p
                                        className={`text-caption font-bold ${alert.critical ? 'text-error-alert' : 'text-outline'
                                            }`}
                                    >
                                        Còn {alert.currentStock} sản phẩm (Ngưỡng: {alert.threshold})
                                    </p>
                                </div>
                            </div>
                            <button className="bg-primary px-4 py-1.5 rounded-lg text-on-primary text-caption font-bold hover:opacity-90">
                                Đặt hàng nhập
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}