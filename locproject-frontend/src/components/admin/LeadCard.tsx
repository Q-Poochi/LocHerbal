interface Lead {
    initials: string;
    name: string;
    phone: string;
    message: string;
}

interface LeadCardProps {
    leads: Lead[];
}

export default function LeadCard({ leads }: LeadCardProps) {
    return (
        <div className="admin-card p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">support_agent</span>
                    <h4 className="text-headline-md font-bold text-primary">Yêu cầu tư vấn mới</h4>
                </div>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full">
                    {leads.length} Chờ xử lý
                </span>
            </div>
            <div className="space-y-3">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-[36px] text-outline mb-3">support_agent</span>
                        <p className="text-body-sm font-semibold text-primary">Không có yêu cầu chờ xử lý</p>
                        <p className="text-caption text-outline mt-1">
                            Tính năng tư vấn chưa được bật. Hãy liên hệ quản trị hệ thống.
                        </p>
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div
                            key={lead.phone}
                            className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                        >
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary-fixed/40 flex items-center justify-center font-bold text-primary">
                                    {lead.initials}
                                </div>
                                <div>
                                    <p className="font-label-bold text-body-sm text-primary">
                                        {lead.name} - <span className="font-normal">{lead.phone}</span>
                                    </p>
                                    <p className="text-caption text-on-surface-variant italic">
                                        &ldquo;{lead.message}&rdquo;
                                    </p>
                                </div>
                            </div>
                            <button className="admin-btn admin-btn-outline !px-3 !py-1.5 !text-xs">
                                <span className="material-symbols-outlined text-[16px]">call</span>
                                Liên hệ
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}