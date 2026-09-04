'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminBlogPosts, useDeleteBlogPost } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils/format';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Nháp',
    published: 'Đã đăng',
    archived: 'Lưu trữ',
};

export default function BlogPostsAdmin() {
    const { data: posts = [], isLoading, error } = useAdminBlogPosts();
    const deleteMutation = useDeleteBlogPost();
    const toast = useToast();
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Đã xoá bài viết');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể xoá bài viết'));
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
                        <span className="text-primary font-semibold">Bài viết</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Bài viết</h2>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="admin-btn admin-btn-primary !px-6 !py-3 !rounded-xl"
                >
                    <span className="material-symbols-outlined">add_box</span>
                    Tạo bài viết mới
                </Link>
            </div>

            {isLoading ? (
                <div className="admin-card p-16 text-center">
                    <span className="text-text-tertiary">Đang tải bài viết...</span>
                </div>
            ) : error ? (
                <div className="admin-card p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải danh sách bài viết')}</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="admin-card p-16 text-center">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">article</span>
                    <p className="text-text-secondary font-medium">Chưa có bài viết nào.</p>
                    <p className="text-sm text-text-tertiary mt-1">Tạo bài viết để chia sẻ kiến thức tới khách hàng.</p>
                </div>
            ) : (
                <div className="admin-card overflow-hidden">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left w-24">Ảnh</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Tiêu đề</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Tác giả</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-center">Trạng thái</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-left">Ngày đăng</th>
                                <th className="p-4 font-semibold text-[13px] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-surface-alt transition-colors">
                                    <td className="p-4">
                                        <div className="w-24 h-14 rounded-lg overflow-hidden border border-border bg-surface-container-low">
                                            {post.thumbnailUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[22px]">image</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-semibold text-primary">{post.title}</p>
                                        <p className="text-xs text-text-tertiary">/{post.slug}</p>
                                    </td>
                                    <td className="p-4 text-sm text-on-surface-variant">{post.author?.fullName ?? '—'}</td>
                                    <td className="p-4 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold ${
                                                post.status === 'published'
                                                    ? 'bg-success-leaf/10 text-success-leaf'
                                                    : 'bg-outline-variant/30 text-on-surface-variant'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-success-leaf' : 'bg-on-surface-variant/50'}`}
                                            />
                                            {STATUS_LABELS[post.status] ?? post.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-on-surface-variant">
                                        {post.publishedAt ? formatDate(post.publishedAt) : '—'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/blog/${post.id}/edit`}
                                                className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteTarget(post.id)}
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
                title="Xoá bài viết"
                message="Bài viết sẽ bị xoá vĩnh viễn. Bạn chắc chắn muốn tiếp tục?"
                isPending={deleteMutation.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}