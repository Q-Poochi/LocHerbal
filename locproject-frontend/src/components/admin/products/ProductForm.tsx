'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useCategories, useCreateProduct, useUpdateProduct, useProductById, CreateProductPayload } from '@/lib/hooks/useProducts';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import VariantEditor, { Variant as VariantEditorVariant } from './VariantEditor';
import EAVAttributeForm from './EAVAttributeForm';
import PublishSidebar from './PublishSidebar';
import ImageUploader from './image-uploader/ImageUploader';

type TabId = 'basic' | 'variants' | 'eav' | 'seo';

const tabs: { id: TabId; label: string }[] = [
    { id: 'basic', label: 'Thông tin cơ bản' },
    { id: 'variants', label: 'Biến thể & Giá' },
    { id: 'eav', label: 'Thuộc tính động (EAV)' },
    { id: 'seo', label: 'SEO' },
];

export default function ProductForm() {
    const params = useParams();
    const productId = params?.id as string | undefined;
    const isEdit = !!productId;

    const { data: categories } = useCategories();
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct(productId ?? '');
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<TabId>('basic');
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [images, setImages] = useState<{ url: string; file?: File; uploading?: boolean }[]>([]);
    const [variants, setVariants] = useState<VariantEditorVariant[]>([]);

    const { data: product, isPending: productLoading } = useProductById(isEdit ? productId : undefined);

    const initialVariants = useMemo(
        () =>
            (product?.variants ?? []).map((v) => ({
                id: v.id || String(Date.now()),
                sku: (v as { sku?: string }).sku || '',
                name: v.name || '',
                price: Number((v as any).priceRaw ?? v.price) || 0,
                compareAtPrice: Number((v as any).compareAtPriceRaw) || 0,
                stock: Number(v.stock) || 0,
                marketPrice: 0,
                marketPriceSource: '',
                discountStartAt: (v as any).discountStartAt ? new Date((v as any).discountStartAt).toISOString().slice(0, 16) : '',
                discountEndAt: (v as any).discountEndAt ? new Date((v as any).discountEndAt).toISOString().slice(0, 16) : '',
            })),
        [product],
    );

    const initialEavValues = useMemo(() => {
        const map: Record<string, string> = {};
        (product as any)?.attributeValues?.forEach((av: any) => {
            const key = av.attribute?.key;
            if (key) map[key] = String(av.value ?? '');
        });
        return map;
    }, [product]);

    useEffect(() => {
        if (!product) return;
        const p = product as any;
        setName(p.name || '');
        setSlug(p.slug || '');
        setDescription(p.description || '');
        setCategoryId(p.category?.id || '');
        setIsPublished(!!p.isPublished);
        setImages((p.images || []).map((img: { url: string }) => ({ url: img.url })));
        setVariants(initialVariants);
    }, [product, initialVariants]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    const handleNameChange = (value: string) => {
        setName(value);
        setSlug(
            value
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, ''),
        );
    };

    const buildPayload = (publish: boolean) => {
        const thumbnailUrl = images.length > 0 ? images[0].url : undefined;
        return {
            categoryId: categoryId || undefined,
            name: name || undefined,
            slug: slug || undefined,
            description: description || undefined,
            thumbnailUrl,
            isPublished: publish,
            images: images.filter((i) => !i.uploading).map((i) => i.url),
            variants: variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                name: v.name,
                price: v.price,
                compareAtPrice: v.compareAtPrice > 0 ? v.compareAtPrice : undefined,
                discountStartAt: v.discountStartAt ? new Date(v.discountStartAt).toISOString() : undefined,
                discountEndAt: v.discountEndAt ? new Date(v.discountEndAt).toISOString() : undefined,
            })),
        } as CreateProductPayload;
    };

    const handleSave = async (publish: boolean) => {
        const payload = buildPayload(publish);

        if (!payload.name || !payload.slug) {
            toast.error('Vui lòng nhập tên sản phẩm và đường dẫn');
            return;
        }

        try {
            if (isEdit) {
                const { images: _ignoredImages, ...core } = payload;
                await updateMutation.mutateAsync(core);
            } else {
                await createMutation.mutateAsync(payload);
            }
            toast.success(publish ? 'Đã xuất bản sản phẩm thành công!' : 'Đã lưu nháp thành công!');
        } catch (err) {
            toast.error(getErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'));
        }
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
            {/* Left Column: Main Form (70%) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Tab Navigation */}
                <div className="bg-surface-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex border-b border-outline-variant px-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`px-6 py-4 font-label-bold text-label-bold transition-colors ${activeTab === tab.id
                                        ? 'active-tab'
                                        : 'text-on-surface-variant hover:text-primary'
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Basic Info */}
                    {activeTab === 'basic' && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold text-label-bold text-on-surface-variant">
                                        Tên sản phẩm <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                                        placeholder="VD: Cao Atiso Sapa"
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold text-label-bold text-on-surface-variant">
                                        Đường dẫn mẫu (Slug)
                                    </label>
                                    <input
                                        className="w-full rounded-lg border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                                        placeholder="cao-atiso-sapa"
                                        type="text"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold text-label-bold text-on-surface-variant">
                                    Mô tả ngắn
                                </label>
                                <textarea
                                    className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                                    placeholder="Tóm tắt đặc điểm nổi bật..."
                                    rows={3}
                                    maxLength={160}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold text-label-bold text-on-surface-variant">
                                    Mô tả chi tiết
                                </label>
                                <div className="border border-outline-variant rounded-lg overflow-hidden">
                                    <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex gap-4">
                                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer text-lg">
                                            format_bold
                                        </span>
                                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer text-lg">
                                            format_italic
                                        </span>
                                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer text-lg">
                                            format_list_bulleted
                                        </span>
                                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer text-lg">
                                            image
                                        </span>
                                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer text-lg">
                                            link
                                        </span>
                                    </div>
                                    <textarea
                                        className="w-full border-none focus:ring-0 p-4"
                                        placeholder="Nhập nội dung chi tiết tại đây..."
                                        rows={8}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-label-bold text-label-bold text-on-surface-variant">
                                        Danh mục gốc
                                    </label>
                                    <select
                                        className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3 appearance-none"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        <option value="">Chọn danh mục...</option>
                                        {(categories ?? []).map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                -- {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <ImageUploader images={images} onChange={setImages} />
                        </div>
                    )}

                    {/* Tab 2: Variants */}
                    {activeTab === 'variants' && (
                        <div className="p-6">
                            <VariantEditor productName={name} variants={variants} onChange={setVariants} />
                        </div>
                    )}

                    {/* Tab 3: EAV */}
                    {activeTab === 'eav' && (
                        <div className="p-6">
                            <EAVAttributeForm
                                categoryId={categoryId || undefined}
                                initialValues={initialEavValues}
                            />
                        </div>
                    )}

                    {/* Tab 4: SEO */}
                    {activeTab === 'seo' && (
                        <div className="p-6 space-y-6">
                            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 space-y-2 mb-6">
                                <p className="text-blue-700 text-lg hover:underline cursor-pointer">
                                    Atiso Sapa Cao Cấp | Tinh Hoa Thảo Dược LocHerbal
                                </p>
                                <p className="text-success-leaf text-sm">
                                    locherbal.vn › san-pham › cao-atiso-sapa
                                </p>
                                <p className="text-on-surface-variant text-sm line-clamp-2">
                                    Mua ngay cao Atiso Sapa chính hãng từ LocHerbal. Hỗ trợ giải độc
                                    gan, thanh lọc cơ thể hiệu quả từ nguồn dược liệu đạt chuẩn
                                    GACP-WHO...
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold text-label-bold text-on-surface-variant">
                                    Meta Title
                                </label>
                                <input
                                    className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                                    placeholder="Tiêu đề trang (Khuyên dùng dưới 60 ký tự)"
                                    type="text"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold text-label-bold text-on-surface-variant">
                                    Meta Description
                                </label>
                                <textarea
                                    className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                                    placeholder="Mô tả nội dung trang cho công cụ tìm kiếm"
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-bold text-label-bold text-on-surface-variant">
                                    OG Image (Social Share)
                                </label>
                                <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex items-center justify-center gap-4 bg-surface-container-lowest">
                                    <span className="material-symbols-outlined text-primary">
                                        add_photo_alternate
                                    </span>
                                    <span className="font-label-bold text-label-bold text-primary">
                                        Chọn ảnh đại diện mạng xã hội
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Bar */}
                <div className="flex items-center gap-4 py-4">
                    <span className="material-symbols-outlined text-on-surface-variant">info</span>
                    <p className="font-caption text-caption text-on-surface-variant">
                        Lưu ý: Bạn có thể lưu bản nháp và quay lại chỉnh sửa sau.
                    </p>
                </div>
            </div>

            {/* Right Column: Sidebar (30%) */}
            <div className="lg:col-span-3">
                <PublishSidebar
                    isPublished={isPublished}
                    isPending={isPending}
                    onTogglePublished={() => setIsPublished((p) => !p)}
                    onSaveDraft={() => handleSave(false)}
                    onPublish={() => handleSave(true)}
                />
            </div>
        </div>
    );
}
