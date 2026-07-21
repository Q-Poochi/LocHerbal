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
        <div className="bg-surface-white p-6 rounded-xl shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant">
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
                {leads.map((lead) => (
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
                                    "{lead.message}"
                                </p>
                            </div>
                        </div>
                        <button className="flex items-center gap-1.5 bg-secondary px-4 py-1.5 rounded-lg text-on-secondary text-caption font-bold hover:opacity-90">
                            <span className="material-symbols-outlined text-[16px]">call</span>
                            Liên hệ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}