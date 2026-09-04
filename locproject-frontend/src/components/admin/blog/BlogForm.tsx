'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBlogPost, useUpdateBlogPost, type AdminBlogPost } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuthStore } from '@/lib/store/auth.store';
import ImageUploader from '@/components/admin/products/image-uploader/ImageUploader';

interface UploadedImage {
    url: string;
    file?: File;
    uploading?: boolean;
}

const STATUSES = [
    { value: 'draft', label: 'Nháp' },
    { value: 'published', label: 'Đã đăng' },
];

function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

interface BlogFormProps {
    post?: AdminBlogPost;
}

export default function BlogForm({ post }: BlogFormProps) {
    const router = useRouter();
    const toast = useToast();
    const user = useAuthStore((s) => s.user);
    const isEdit = !!post;

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [thumbnailImages, setThumbnailImages] = useState<UploadedImage[]>([]);
    const [status, setStatus] = useState('draft');
    const [slugTouched, setSlugTouched] = useState(false);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setSlug(post.slug);
            setContent(post.content);
            setThumbnailImages(post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : []);
            setStatus(post.status === 'published' ? 'published' : 'draft');
            setSlugTouched(true);
        }
    }, [post]);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!slugTouched) setSlug(slugify(value));
    };

    const createMutation = useCreateBlogPost();
    const updateMutation = useUpdateBlogPost();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalSlug = slug || slugify(title);
        if (!title.trim() || !finalSlug) {
            toast.error('Vui lòng nhập tiêu đề bài viết');
            return;
        }
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung bài viết');
            return;
        }
        if (!user?.id) {
            toast.error('Bạn cần đăng nhập để tạo bài viết');
            return;
        }
        const payload = {
            title: title.trim(),
            slug: finalSlug,
            content: content.trim(),
            thumbnailUrl: thumbnailImages.find((i) => !i.uploading)?.url || undefined,
            authorId: user.id,
            status,
        };
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: post.id, payload });
                toast.success('Đã cập nhật bài viết');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Đã tạo bài viết');
            }
            router.push('/admin/blog');
            router.refresh();
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể lưu bài viết'));
        }
    };

    const label = 'font-label-bold text-label-bold text-primary';
    const field =
        'w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors';

    return (
        <form onSubmit={handleSubmit}>
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-8">
                <span>Nội dung</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span>Bài viết</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">{isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">{isEdit ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="space-y-6">
                    <section className="admin-card p-6 space-y-6">
                        <div>
                            <label htmlFor="post-title" className={label}>
                                Tiêu đề
                            </label>
                            <input
                                id="post-title"
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="VD: Lợi ích của thảo dược thiên nhiên với sức khỏe"
                                className={`${field} mt-2`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="post-slug" className={label}>
                                    Slug (URL)
                                </label>
                                <input
                                    id="post-slug"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlug(e.target.value);
                                        setSlugTouched(true);
                                    }}
                                    placeholder="tự động sinh theo tiêu đề"
                                    className={`${field} mt-2 font-mono text-sm`}
                                />
                            </div>
                            <div>
                                <label htmlFor="post-status" className={label}>
                                    Trạng thái
                                </label>
                                <select id="post-status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} mt-2`}>
                                    {STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={label}>Ảnh đại diện</label>
                            <div className="mt-2">
                                <ImageUploader images={thumbnailImages} onChange={setThumbnailImages} maxFiles={1} />
                            </div>
                        </div>
                    </section>

                    <section className="admin-card p-6">
                        <label htmlFor="post-content" className={label}>
                            Nội dung bài viết
                        </label>
                        <p className="text-xs text-text-tertiary mt-1 mb-2">Nội dung văn bản thuần, mỗi dòng một đoạn. Hiển thị trên trang chủ.</p>
                        <textarea
                            id="post-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={14}
                            placeholder={'Viết nội dung bài viết tại đây...\n\nCó thể xuống dòng để tạo đoạn văn mới.'}
                            className={`${field} resize-y leading-relaxed`}
                        />
                    </section>
                </div>

                <aside className="admin-card p-5 space-y-2 lg:sticky lg:top-24">
                    <p className="text-sm font-semibold text-primary">Lưu ý</p>
                    <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
                        <li className="flex gap-2 items-start">
                            <span className="material-symbols-outlined text-[14px] mt-0.5 text-primary">info</span>
                            Slug không được trùng với bài viết khác và nên giữ ổn định sau khi đăng.
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="material-symbols-outlined text-[14px] mt-0.5 text-primary">photo</span>
                            Ảnh đại diện hỗ trợ PNG, JPEG, WebP (kiểm tra theo nội dung file).
                        </li>
                        <li className="flex gap-2 items-start">
                            <span className="material-symbols-outlined text-[14px] mt-0.5 text-primary">publish</span>
                            Bài viết chỉ hiển thị trên trang chủ khi trạng thái là “Đã đăng”.
                        </li>
                    </ul>
                </aside>
            </div>

            <div className="flex justify-between items-center pt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors"
                    disabled={isPending}
                >
                    Quay lại
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="admin-btn admin-btn-primary !px-8 !py-3 !rounded-xl"
                >
                    {isPending && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                    {isEdit ? 'Cập nhật bài viết' : 'Tạo bài viết'}
                </button>
            </div>
        </form>
    );
}