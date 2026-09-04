'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminBanners, useDeleteBanner } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const POSITION_LABELS: Record<string, string> = {
    home: 'Carousel trang chủ',
    promo: 'Khuyến mãi',
    hero: 'Ảnh Hero',
};

export default function BannersAdmin() {
    const { data: banners = [], isLoading, error } = useAdminBanners();
    const deleteMutation = useDeleteBanner();
    const toast = useToast();
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Đã xoá banner');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể xoá banner'));
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Nội dung</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">Banner</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Banner</h2>
                </div>
                <Link
                    href="/admin/banners/new"
                    className="admin-btn admin-btn-primary !px-6 !py-3 !rounded-xl"
                >
                    <span className="material-symbols-outlined">add_box</span>
                    Tạo banner mới
                </Link>
            </div>

            {isLoading ? (
                <div className="admin-card p-16 text-center">
                    <span className="text-text-tertiary">Đang tải banner...</span>
                </div>
            ) : error ? (
                <div className="admin-card p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải danh sách banner')}</p>
                </div>
            ) : banners.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">view_carousel</span>
                    <p className="text-text-secondary font-medium">Chưa có banner nào.</p>
                    <p className="text-sm text-text-tertiary mt-1">Tạo banner đầu tiên để hiển thị trên trang chủ.</p>
                </div>
            ) : (
                <div className="admin-card overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left w-24">Ảnh</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Tiêu đề</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Vị trí</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Thứ tự</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {banners.map((banner) => (
                                <tr key={banner.id} className="hover:bg-surface-alt transition-colors">
                                    <td className="p-4">
                                        <div className="w-24 h-14 rounded-lg overflow-hidden border border-border bg-surface-container-low">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-semibold text-primary">{banner.title}</p>
                                        {banner.linkUrl && (
                                            <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-text-tertiary hover:text-primary">
                                                {banner.linkUrl}
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-surface-container-low text-on-surface-variant">
                                            {POSITION_LABELS[banner.position] ?? banner.position}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-sm text-on-surface-variant">{banner.sortOrder}</td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold ${
                                                banner.isActive ? 'bg-success-leaf/10 text-success-leaf' : 'bg-outline-variant/30 text-on-surface-variant'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? 'bg-success-leaf' : 'bg-on-surface-variant/50'}`} />
                                            {banner.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/banners/${banner.id}/edit`}
                                                className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(banner.id)}
                                                className="p-1.5 text-text-tertiary hover:text-error hover:bg-error-container/10 transition-all rounded-lg inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xoá banner"
                message="Banner sẽ bị xoá vĩnh viễn. Bạn chắc chắn muốn tiếp tục?"
                isPending={deleteMutation.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}