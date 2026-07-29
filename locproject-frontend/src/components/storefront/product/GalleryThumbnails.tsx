'use client';

import Image from 'next/image';
import { useState } from 'react';

interface GalleryThumbnailsProps {
    images: { url: string; alt: string }[];
    fallbackUrl?: string;
}

export default function GalleryThumbnails({ images, fallbackUrl }: GalleryThumbnailsProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const hasImages = images.length > 0;
    const displayUrl = hasImages ? images[selectedIndex].url : fallbackUrl;
    const displayAlt = hasImages ? images[selectedIndex].alt : 'Hình ảnh sản phẩm';

    return (
        <div className="space-y-6">
            {/* Main Image */}
            <div className="relative group aspect-square bg-[#f0eee8] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(27,67,50,0.05)] border border-outline-variant/30">
                {displayUrl ? (
                    <Image
                        className="w-full h-full object-contain p-8"
                        src={displayUrl}
                        alt={displayAlt}
                        fill
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-[#c1c8c2]">image</span>
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-bold text-label-bold flex items-center gap-1 shadow-lg">
                    <span className="material-symbols-outlined text-[18px] filled-icon">workspace_premium</span>
                    Bán chạy #1
                </div>
                {/* TODO: implement image zoom — cần thiết kế UI trước */}
            </div>

            {/* Thumbnail Row — only if there are multiple images */}
            {hasImages && images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-white transition-colors ${
                                index === selectedIndex
                                    ? 'border-2 border-primary'
                                    : 'border border-outline-variant hover:border-primary'
                            }`}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <Image className="w-full h-full object-cover" src={image.url} alt={image.alt || 'Hình ảnh sản phẩm'} width={80} height={80} />
                        </button>
                    ))}
                </div>
            )}

            {/* Thumbnail Row */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {images.map((image, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-white transition-colors ${index === selectedIndex
                            ? 'border-2 border-primary'
                            : 'border border-outline-variant hover:border-primary'
                            }`}
                        onClick={() => setSelectedIndex(index)}
                    >
                        <Image className="w-full h-full object-cover" src={image.url} alt={image.alt || 'Hình ảnh sản phẩm'} width={80} height={80} />
                    </button>
                ))}
            </div>
        </div>
    );
}