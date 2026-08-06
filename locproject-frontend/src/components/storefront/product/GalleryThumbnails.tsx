'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { resolveImageUrl } from '../../../lib/utils/imageUrl';

interface GalleryThumbnailsProps {
    images: { url: string; alt: string }[];
    fallbackUrl?: string;
    productName?: string;
}

export default function GalleryThumbnails({ images, fallbackUrl, productName = 'Sản phẩm' }: GalleryThumbnailsProps) {
    const [mainImage, setMainImage] = useState<string>('');
    const [hasValidImage, setHasValidImage] = useState(true);

    const imageUrls = images.map(img => resolveImageUrl(img.url)).filter(Boolean);
    if (imageUrls.length === 0 && resolveImageUrl(fallbackUrl)) {
        imageUrls.push(resolveImageUrl(fallbackUrl));
    }

    useEffect(() => {
        if (imageUrls.length > 0) {
            setMainImage((prev) => prev || imageUrls[0]);
            setHasValidImage(true);
        } else {
            setHasValidImage(false);
        }
    }, [imageUrls]);

    return (
        <div className="space-y-4">
            {/* Main Image Container */}
            <div className="relative w-full aspect-square bg-[#f4f4f0] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant/30">
                {hasValidImage && mainImage ? (
                    <Image
                        src={mainImage}
                        alt={productName}
                        fill
                        className="object-cover hover:scale-102 transition-transform duration-500"
                        onError={() => setHasValidImage(false)}
                    />
                ) : (
                    /* Placeholder đẹp khi không có ảnh */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#9a9a90]">
                        <span className="material-symbols-outlined text-6xl opacity-30">
                            medication
                        </span>
                        <span className="text-sm">Chưa có hình ảnh</span>
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-bold text-label-bold flex items-center gap-1 shadow-lg z-10">
                    <span className="material-symbols-outlined text-[18px] filled-icon">workspace_premium</span>
                    Bán chạy #1
                </div>
            </div>

            {/* Thumbnails Row */}
            {imageUrls.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {imageUrls.slice(0, 5).map((img, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                setMainImage(img);
                                setHasValidImage(true);
                            }}
                            className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-colors
                                ${mainImage === img
                                    ? 'border-[#1a8a54]'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                        >
                            <div className="w-full h-full bg-[#f4f4f0] flex items-center justify-center relative">
                                {img ? (
                                    <Image
                                        src={img}
                                        alt=""
                                        width={72}
                                        height={72}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-2xl text-gray-300">medication</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}