'use client';

import { useState } from 'react';

interface Ticket {
    id: string;
    customer: string;
    subject: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    assignee: string;
    lastUpdate: string;
}

const mock: Ticket[] = [
    { id: 'TKT-001', customer: 'Nguyễn Văn A', subject: 'Sản phẩm giao thiếu số lượng', priority: 'HIGH', status: 'OPEN', assignee: '—', lastUpdate: '24/07 10:30' },
    { id: 'TKT-002', customer: 'Trần Thị Bích', subject: 'Hướng dẫn sử dụng sản phẩm', priority: 'LOW', status: 'IN_PROGRESS', assignee: 'Minh Anh', lastUpdate: '24/07 09:15' },
    { id: 'TKT-003', customer: 'Lê Hoàng Cường', subject: 'Khiếu nại về chất lượng sản phẩm', priority: 'URGENT', status: 'OPEN', assignee: '—', lastUpdate: '24/07 08:45' },
    { id: 'TKT-004', customer: 'Phạm Minh Đức', subject: 'Yêu cầu xuất hóa đơn GTGT', priority: 'MEDIUM', status: 'RESOLVED', assignee: 'Tuấn Anh', lastUpdate: '23/07 16:00' },
    { id: 'TKT-005', customer: 'Hoàng Kim Ngân', subject: 'Đổi trả sản phẩm bị lỗi', priority: 'HIGH', status: 'IN_PROGRESS', assignee: 'Minh Anh', lastUpdate: '23/07 14:30' },
    { id: 'TKT-006', customer: 'Vũ Thanh Hải', subject: 'Hỏi về chương trình khuyến mãi', priority: 'LOW', status: 'CLOSED', assignee: 'Tuấn Anh', lastUpdate: '22/07 17:00' },
];

const priorityBadge: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    HIGH: 'bg-red-100 text-red-700',
    URGENT: 'bg-purple-100 text-purple-700',
};

const priorityLabel: Record<string, string> = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp',
};

const statusBadge: Record<string, string> = {
    OPEN: 'bg-orange-100 text-orange-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-outline-variant text-outline',
};

const statusLabel: Record<string, string> = {
    OPEN: 'Đang mở',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    CLOSED: 'Đã đóng',
};

type Tab = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'OPEN', label: 'Đang mở' },
    { key: 'IN_PROGRESS', label: 'Đang xử lý' },
    { key: 'RESOLVED', label: 'Đã giải quyết' },
];

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState<Tab>('all');

    const filtered = activeTab === 'all' ? mock : mock.filter((t) => t.status === activeTab);
    const urgentCount = mock.filter((t) => t.priority === 'URGENT').length;

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">support</span>
                <span>Hỗ trợ</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Yêu cầu hỗ trợ</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Yêu cầu hỗ trợ</h2>
                {urgentCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-4 py-2 rounded-xl font-bold text-caption">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        {urgentCount} yêu cầu khẩn cấp
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-0.5 border border-outline-variant/30 mb-6 w-fit">
                {tabs.map((tab) => (
                    <button key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === tab.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
                        {tab.label}
                        <span className="ml-1.5 opacity-70">({tab.key === 'all' ? mock.length : mock.filter((t) => t.status === tab.key).length})</span>
                    </button>
                ))}
            </div>

            {/* Cards view */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((ticket) => (
                    <div key={ticket.id}
                        className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-caption font-mono font-bold text-primary">{ticket.id}</span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${priorityBadge[ticket.priority]}`}>
                                {priorityLabel[ticket.priority]}
                            </span>
                        </div>
                        <h4 className="font-label-bold text-body-sm text-primary mb-4 line-clamp-2">{ticket.subject}</h4>
                        <div className="space-y-1.5 mb-5">
                            <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                {ticket.customer}
                            </div>
                            <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">person_pin</span>
                                {ticket.assignee === '—' ? <span className="italic text-outline">Chưa phân công</span> : ticket.assignee}
                            </div>
                            <div className="flex items-center gap-2 text-caption text-on-surface-variant">
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {ticket.lastUpdate}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${statusBadge[ticket.status]}`}>
                                {statusLabel[ticket.status]}
                            </span>
                            <button className="text-primary font-bold text-caption hover:underline">Xem chi tiết →</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl text-outline mb-4">confirmation_number</span>
                        <p className="text-body-sm">Không có yêu cầu nào ở trạng thái này.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
