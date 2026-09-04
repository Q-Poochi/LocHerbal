'use client';

import { useState } from 'react';
import {
    useAdminConsultations,
    useUpdateLeadStatus,
} from '@/lib/hooks/useConsultation';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';

const STATUS_META: Record<string, { label: string; badge: string; dot: string; next?: string[] }> = {
    NEW: { label: 'Mới', badge: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary', next: ['CONTACTED', 'CONFIRMED', 'CANCELLED'] },
    CONTACTED: { label: 'Đã liên hệ', badge: 'bg-info/10 text-info', dot: 'bg-info', next: ['CONFIRMED', 'CANCELLED'] },
    CONFIRMED: { label: 'Đã xác nhận', badge: 'bg-success-leaf/10 text-success-leaf', dot: 'bg-success-leaf', next: ['CONVERTED', 'CANCELLED'] },
    CONVERTED: { label: 'Chốt đơn', badge: 'bg-success-leaf/15 text-success-leaf-dark', dot: 'bg-success-leaf-dark', next: ['CLOSED'] },
    CANCELLED: { label: 'Hủy', badge: 'bg-error-container/30 text-error', dot: 'bg-error', next: [] },
    CLOSED: { label: 'Đóng', badge: 'bg-outline-variant/30 text-on-surface-variant', dot: 'bg-on-surface-variant/50', next: [] },
};

export default function ConsultationsAdmin() {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const { data, isLoading, error } = useAdminConsultations({ status: statusFilter === 'ALL' ? undefined : statusFilter });
    const updateStatus = useUpdateLeadStatus();
    const toast = useToast();

    const leads = data?.data ?? [];

    const filtered = search.trim()
        ? leads.filter((l) =>
            `${l.fullName} ${l.phone} ${l.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
        )
        : leads;

    const handleStatus = async (id: string, status: string) => {
        try {
            await updateStatus.mutateAsync({ id, status });
            toast.success('Đã cập nhật trạng thái');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Cập nhật thất bại'));
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (iso?: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };
    const formatDateTime = (iso?: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Vận hành</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">Lịch tư vấn</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý lịch tư vấn</h2>
                    <p className="text-sm text-on-surface-variant mt-1">
                        Theo dõi yêu cầu tư vấn từ khách trên website và cập nhật trạng thái xử lý.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-md min-w-[240px]">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">search</span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm tên, SĐT..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'CONVERTED', 'CANCELLED', 'CLOSED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                                statusFilter === s
                                    ? 'bg-primary-700 text-white shadow-md'
                                    : 'bg-surface-white border border-outline-variant text-on-surface-variant hover:border-primary-400'
                            }`}
                        >
                            {s === 'ALL' ? 'Tất cả' : STATUS_META[s]?.label ?? s}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="admin-card p-24 text-center">
                    <span className="text-text-tertiary">Đang tải yêu cầu tư vấn...</span>
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl border border-border p-24 text-center">
                    <span className="material-symbols-outlined text-[48px] text-error mb-3">error</span>
                    <p className="text-text-secondary font-medium">Không thể tải danh sách.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-border p-24 text-center">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">event_available</span>
                    <p className="text-text-secondary font-medium">
                        {search ? 'Không tìm thấy yêu cầu phù hợp.' : 'Chưa có yêu cầu tư vấn nào.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Khách hàng</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Lịch hẹn</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Nội dung</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Người phụ trách</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {filtered.map((lead) => {
                                const meta = STATUS_META[lead.status] ?? STATUS_META.NEW;
                                return (
                                    <tr key={lead.id} className="hover:bg-surface-alt transition-colors">
                                        <td className="p-4">
                                            <p className="font-semibold text-primary">{lead.fullName}</p>
                                            <p className="text-[13px] text-on-surface-variant">📞 {lead.phone}</p>
                                            {lead.email && <p className="text-[13px] text-on-surface-variant">✉️ {lead.email}</p>}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[13px] font-medium text-primary">
                                                {formatDate(lead.preferredDate)} · {lead.preferredTime || '—'}
                                            </p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">
                                                Tạo: {formatDateTime(lead.createdAt)}
                                            </p>
                                            {lead.confirmedAt && (
                                                <p className="text-xs text-success-leaf mt-0.5">✓ Xác nhận {formatDateTime(lead.confirmedAt)}</p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-on-surface-variant max-w-[220px] line-clamp-2">
                                                {lead.note || '—'}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${meta.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-sm text-on-surface-variant">
                                            {lead.assignee?.fullName ?? '—'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {(meta.next ?? []).map((s) => (
                                                    <button
                                                        key={s}
                                                        disabled={updateStatus.isPending}
                                                        onClick={() => handleStatus(lead.id, s)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 ${
                                                            s === 'CANCELLED'
                                                                ? 'text-error bg-error-container/10 hover:bg-error-container/40'
                                                                : s === 'CONVERTED'
                                                                    ? 'text-success-leaf-dark bg-success-leaf/10 hover:bg-success-leaf/20'
                                                                    : 'text-primary-700 bg-primary-100 hover:bg-primary-200'
                                                        }`}
                                                    >
                                                        {STATUS_META[s]?.label ?? s}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}