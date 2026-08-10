'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useHeroBanner, useUpsertHeroBanner, useDeleteHeroBanner } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageUploader from '@/components/admin/products/image-uploader/ImageUploader';
import { storeLinkGroups } from '@/lib/constants/store-links';

interface UploadedImage {
    url: string;
    file?: File;
    uploading?: boolean;
}

export default function AdminHeroBanner() {
    const router = useRouter();
    const toast = useToast();
    const { data: hero, isLoading, error } = useHeroBanner();
    const upsertMutation = useUpsertHeroBanner();
    const deleteMutation = useDeleteHeroBanner();

    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (hero) {
            setTitle(hero.title);
            setLinkUrl(hero.linkUrl ?? '');
        }
    }, [hero]);

    const currentImageUrl = hero?.imageUrl ?? '';

    const heroImageUrl = images[0]?.url ?? currentImageUrl;
    const heroTitle = title || hero?.title || 'Ảnh Hero';

    const linkGroups = storeLinkGroups();
    const currentLink = hero?.linkUrl ?? '';
    const hasCustomLink = !!currentLink && !linkGroups.some((o) => o.href === currentLink);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const imageUrl = images.find((i) => !i.uploading)?.url ?? currentImageUrl;
        if (!title.trim() || !imageUrl) {
            toast.error('Vui lòng nhập tiêu đề và tải ảnh hero');
            return;
        }
        try {
            await upsertMutation.mutateAsync({
                title: title.trim(),
                imageUrl,
                linkUrl: linkUrl || undefined,
                isActive: true,
            });
            toast.success('Đã lưu ảnh hero');
            router.refresh();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Không thể lưu ảnh hero'));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync();
            setConfirmDelete(false);
            toast.success('Đã xoá ảnh hero — trang chủ về icon chày cối');
            router.refresh();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Không thể xoá ảnh hero'));
        }
    };

    if (isLoading) {
        return <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
            <span className="text-text-tertiary">Đang tải ảnh hero...</span>
        </div>;
    }

    const label = 'font-label-bold text-label-bold text-primary';
    const inputCls =
        'w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors';

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Nội dung</span>
                        <span className="material-symbols-outlined text-[14px]">{'chevron_right'}</span>
                        <span className="text-primary font-semibold">Ảnh Hero</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">Ảnh Hero (Banner chính)</h2>
                    <p className="text-sm text-text-tertiary mt-1">
                        Ảnh này thay icon chày cối trong khối &ldquo;Chăm Sóc Sức Khỏe&rdquo; trên trang chủ — chỉ có 1 ảnh duy nhất.
                    </p>
                </div>
                <Link
                    href="/admin/banners"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">view_carousel</span>
                    Banner Carousel
                </Link>
            </div>

            {error ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải ảnh hero')}</p>
                </div>
            ) : (
                <form onSubmit={handleSave} className="max-w-[760px]">
                    <section className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="hero-title" className={label}>Tiêu đề</label>
                            <input
                                id="hero-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={hero?.title || 'VD: Đồng hành sức khỏe thiên nhiên'}
                                className={inputCls}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="hero-link" className={label}>Đường dẫn (tùy chọn)</label>
                            <select
                                id="hero-link"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">— Không có đường dẫn —</option>
                                {hasCustomLink && (
                                    <option value={currentLink}>Đường dẫn hiện tại — {currentLink}</option>
                                )}
                                {linkGroups.map((o) => (
                                    <option key={o.href} value={o.href}>{o.group} — {o.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={label}>Ảnh hero (chọn 1 ảnh duy nhất)</label>
                            <ImageUploader images={images} onChange={setImages} maxFiles={1} />
                        </div>

                        <div className="pt-1">
                            <p className="font-label-bold text-label-bold text-primary mb-2">Xem trước khối Hero:</p>
                            <div className="flex items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary-50 to-accent-gold-pale p-6">
                                <div className="w-40 aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-primary-200 shadow-lg relative">
                                    {heroImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={heroImageUrl} alt={heroTitle} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span
                                                className="material-symbols-outlined text-primary-300"
                                                style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}
                                            >
                                                local_pharmacy
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-between items-center pt-6">
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            disabled={!currentImageUrl || deleteMutation.isPending}
                            className="px-6 py-3 rounded-xl border border-error/30 text-error font-label-bold hover:bg-error-container/10 transition-colors disabled:opacity-40 inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Xoá ảnh hero
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                type="submit"
                                disabled={upsertMutation.isPending}
                                className="px-8 py-3 rounded-xl bg-primary-container text-white font-label-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                {upsertMutation.isPending && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                                {currentImageUrl ? 'Cập nhật ảnh hero' : 'Lưu ảnh hero'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <ConfirmDialog
                open={confirmDelete}
                title="Xoá ảnh hero"
                message="Khối 'Chăm Sóc Sức Khỏe' trên trang chủ sẽ quay lại icon chày cối. Bạn chắc chắn?"
                isPending={deleteMutation.isPending}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </>
    );
}