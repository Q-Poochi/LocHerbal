'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBanner, useUpdateBanner, type AdminBanner } from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ImageUploader from '@/components/admin/products/image-uploader/ImageUploader';

interface UploadedImage {
    url: string;
    file?: File;
    uploading?: boolean;
}

// Vị trí CHỈ dành cho carousel trang chủ — không còn lựa chọn chọn nhầm 'hero'.
const POSITIONS = ['home', 'promo'];

interface BannerFormProps {
    banner?: AdminBanner;
}

export default function BannerForm({ banner }: BannerFormProps) {
    const router = useRouter();
    const toast = useToast();
    const isEdit = !!banner;

    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [position, setPosition] = useState('home');
    const [sortOrder, setSortOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (banner) {
            setTitle(banner.title);
            setLinkUrl(banner.linkUrl ?? '');
            setImages(banner.imageUrl ? [{ url: banner.imageUrl }] : []);
            setPosition(POSITIONS.includes(banner.position) ? banner.position : 'home');
            setSortOrder(banner.sortOrder);
            setIsActive(banner.isActive);
        }
    }, [banner]);

    const createMutation = useCreateBanner();
    const updateMutation = useUpdateBanner();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const imageUrl = images.find((i) => !i.uploading)?.url;
        if (!title.trim() || !imageUrl) {
            toast.error('Vui lòng nhập tiêu đề và tải ảnh banner');
            return;
        }
        const payload = {
            title: title.trim(),
            linkUrl: linkUrl.trim() || undefined,
            imageUrl,
            position,
            sortOrder,
            isActive,
        };
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: banner.id, payload });
                toast.success('Đã cập nhật banner');
            } else {
                await createMutation.mutateAsync(payload);
                toast.success('Đã tạo banner mới');
            }
            router.push('/admin/banners');
            router.refresh();
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể lưu banner'));
        }
    };

    const label = 'font-label-bold text-label-bold text-primary';
    const selectCls =
        'w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary focus:outline-none focus:border-primary transition-colors';

    return (
        <form onSubmit={handleSubmit} className="max-w-[760px]">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-8">
                <span>Nội dung</span>
                <span className="material-symbols-outlined text-[14px]">{'chevron_right'}</span>
                <span>Banner</span>
                <span className="material-symbols-outlined text-[14px]">{'chevron_right'}</span>
                <span className="text-primary font-semibold">{isEdit ? `Chỉnh sửa banner` : 'Tạo banner mới'}</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-8">{isEdit ? 'Chỉnh sửa Banner' : 'Tạo Banner mới'}</h2>
            <p className="text-sm text-text-tertiary -mt-4 mb-8">Banner &ldquo;Carousel trang chủ&rdquo; hiển thị slider đầu trang. Ảnh Hero (thay icon chày cối) quản lý riêng tại mục &ldquo;Ảnh Hero&rdquo;.</p>

            <section className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="banner-title" className={label}>
                            Tiêu đề
                        </label>
                        <input
                            id="banner-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VD: Đồng hành sức khỏe thiên nhiên"
                            className="w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="banner-link" className={label}>
                            Đường dẫn (tùy chọn)
                        </label>
                        <input
                            id="banner-link"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="/products"
                            className="w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={label}>Ảnh banner</label>
                    <ImageUploader images={images} onChange={setImages} maxFiles={1} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label htmlFor="banner-position" className={label}>
                            Vị trí
                        </label>
                        <select
                            id="banner-position"
                            value={position}
onChange={(e) => setPosition(e.target.value)}
                            className={selectCls}
                        >
                            <option value="home">Carousel trang chủ</option>
                            <option value="promo">Khuyến mãi</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="banner-sort" className={label}>
                            Thứ tự hiển thị
                        </label>
                        <input
                            id="banner-sort"
                            type="number"
                            min={0}
                            step={1}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(Number(e.target.value))}
                            className="w-full bg-surface-container-low border border-border rounded-xl px-4 py-3 text-body-md text-primary focus:outline-none focus:border-primary transition-colors"
                        />
                        <p className="text-xs text-text-tertiary mt-1">Số nhỏ hiển thị trước.</p>
                    </div>
                </div>

                {position === 'home' && (
                    <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                        <div>
                            <p className="font-semibold text-primary text-body-md">Kích hoạt banner</p>
                            <p className="text-sm text-text-tertiary mt-0.5">Banner kích hoạt sẽ hiển thị trên trang chủ.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive((v) => !v)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-outline-variant'}`}
                            aria-label={isActive ? 'Banner đang kích hoạt' : 'Banner đang tắt'}
                        >
                            <span
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                            />
                        </button>
                    </div>
                )}
            </section>

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
                    className="px-8 py-3 rounded-xl bg-primary-container text-white font-label-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                    {isPending && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                    {isEdit ? 'Cập nhật banner' : 'Tạo banner'}
                </button>
            </div>
        </form>
    );
}