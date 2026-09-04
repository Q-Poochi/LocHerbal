'use client';

import { useState } from 'react';

type Tab = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'OPEN', label: 'Đang mở' },
    { key: 'IN_PROGRESS', label: 'Đang xử lý' },
    { key: 'RESOLVED', label: 'Đã giải quyết' },
];

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState<Tab>('all');

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">support</span>
                <span>Hỗ trợ</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary-700 font-semibold">Yêu cầu hỗ trợ</span>
            </nav>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Yêu cầu hỗ trợ</h2>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-surface-alt rounded-xl p-0.5 border border-border mb-6 w-fit">
                {tabs.map((tab) => (
                    <button key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-text-tertiary hover:text-primary-700'}`}>
                        {tab.label}
                        <span className="ml-1.5 opacity-70">(0)</span>
                    </button>
                ))}
            </div>

            {/* Empty state */}
            <div className="admin-card overflow-hidden">
                <div className="flex flex-col items-center justify-center py-24 text-center px-8">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">confirmation_number</span>
                    <p className="text-text-secondary font-semibold text-base">Chưa có yêu cầu hỗ trợ</p>
                    <p className="text-sm text-text-tertiary mt-1 max-w-sm">
                        Yêu cầu hỗ trợ từ khách hàng sẽ hiển thị tại đây khi backend cung cấp API.
                    </p>
                </div>
            </div>
        </div>
    );
}
