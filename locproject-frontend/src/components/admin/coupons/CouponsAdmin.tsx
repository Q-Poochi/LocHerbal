'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminCoupons, useDeleteCoupon } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils/format';

function formatMoney(n: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function CouponsAdmin() {
    const { data: coupons = [], isLoading, error } = useAdminCoupons();
    const deleteMutation = useDeleteCoupon();
    const toast = useToast();
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Đã xoá mã giảm giá');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể xoá mã giảm giá'));
        } finally {
            setDeleteTarget(null);
        }
    };

    const today = new Date();
    const isExpired = (c: { endDate: string }) => new Date(c.endDate) < today;
    const isUpcoming = (c: { startDate: string }) => new Date(c.startDate) > today;

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Nội dung</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">Ưu đãi</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Ưu đãi</h2>
                </div>
                <Link
                    href="/admin/coupons/new"
                    className="bg-primary-container text-white px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add_box</span>
                    Tạo mã mới
                </Link>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <span className="text-text-tertiary">Đang tải mã giảm giá...</span>
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải danh sách mã giảm giá')}</p>
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">sell</span>
                    <p className="text-text-secondary font-medium">Chưa có mã giảm giá nào.</p>
                    <p className="text-sm text-text-tertiary mt-1">Tạo mã để áp dụng cho khách hàng khi thanh toán.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Mã</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Giá trị</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Điều kiện</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Đã dùng</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Hiệu lực</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {coupons.map((coupon) => {
                                const expired = isExpired(coupon);
                                const upcoming = isUpcoming(coupon);
                                const activeState = coupon.isActive && !expired;
                                return (
                                    <tr key={coupon.id} className="hover:bg-surface-alt transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-primary bg-primary-50 border border-primary-200 rounded-lg px-2.5 py-1 text-sm">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-primary">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}
                                            </p>
                                            {coupon.minOrderValue > 0 && (
                                                <p className="text-xs text-text-tertiary mt-0.5">Tối thiểu {formatMoney(coupon.minOrderValue)}</p>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-on-surface-variant">
                                            {coupon.usageLimit != null ? `${coupon.usedCount}/${coupon.usageLimit}` : 'Không giới hạn'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                                    coupon.usedCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-surface-container-low text-on-surface-variant'
                                                }`}
                                            >
                                                {coupon.usedCount}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-on-surface-variant">
                                            <p>{formatDate(coupon.startDate)}</p>
                                            <p className="text-xs text-text-tertiary">→ {formatDate(coupon.endDate)}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold ${
                                                    activeState
                                                        ? 'bg-success-leaf/10 text-success-leaf'
                                                        : expired
                                                          ? 'bg-outline-variant/30 text-on-surface-variant'
                                                          : 'bg-outline-variant/30 text-on-surface-variant'
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        activeState ? 'bg-success-leaf' : 'bg-on-surface-variant/50'
                                                    }`}
                                                />
                                                {activeState ? (upcoming ? 'Sắp diễn ra' : 'Đang chạy') : expired ? 'Hết hạn' : coupon.isActive ? 'Tạm dừng' : 'Vô hiệu'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/admin/coupons/${coupon.id}/edit`}
                                                    className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(coupon.id)}
                                                    disabled={coupon.usedCount > 0}
                                                    title={coupon.usedCount > 0 ? 'Không thể xoá mã đã có người sử dụng' : 'Xoá mã'}
                                                    className="p-1.5 text-text-tertiary hover:text-error hover:bg-error-container/10 transition-all rounded-lg inline-flex disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xoá mã giảm giá"
                message="Mã sẽ bị xoá vĩnh viễn khỏi hệ thống. Bạn chắc chắn muốn tiếp tục?"
                isPending={deleteMutation.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}