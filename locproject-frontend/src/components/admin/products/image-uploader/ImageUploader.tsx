'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

interface UploadedImage {
    url: string;
    file?: File;
    uploading?: boolean;
}

interface ImageUploaderProps {
    images: UploadedImage[];
    onChange: (updater: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
    maxFiles?: number;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ImageUploader({ images, onChange, maxFiles = 5 }: ImageUploaderProps) {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const doUpload = async (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter(
            (f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE,
        );
        if (fileArray.length === 0) return;

        const slotsLeft = maxFiles - images.length;
        const toUpload = fileArray.slice(0, slotsLeft);
        if (toUpload.length === 0) return;

        const previews: UploadedImage[] = toUpload.map((f) => ({
            url: URL.createObjectURL(f),
            file: f,
            uploading: true,
        }));

        onChange((prev) => [...prev, ...previews]);

        const formData = new FormData();
        toUpload.forEach((f) => formData.append('files', f));

        try {
            const { data } = await apiClient.post<{ url: string }[]>('/upload', formData);
            const urlMap = new Map<string, string>();
            previews.forEach((p, i) => urlMap.set(p.url, data[i]?.url ?? p.url));

            onChange((prev) =>
                prev.map((img) =>
                    img.uploading ? { url: urlMap.get(img.url) ?? img.url, uploading: false } : img,
                ),
            );
        } catch {
            onChange((prev) => prev.filter((img) => !img.uploading));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) doUpload(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleClick = () => inputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) doUpload(e.target.files);
        e.target.value = '';
    };

    const removeImage = (idx: number) => {
        onChange((prev) => prev.filter((_, i) => i !== idx));
    };

    const setPrimary = (idx: number) => {
        onChange((prev) => {
            const updated = [...prev];
            const [item] = updated.splice(idx, 1);
            updated.unshift(item);
            return updated;
        });
    };

    const slotsLeft = maxFiles - images.length;

    return (
        <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface-variant">
                Hình ảnh sản phẩm
            </label>

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
            >
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">cloud_upload</span>
                </div>
                <div className="text-center">
                    <p className="font-label-bold text-label-bold text-primary">
                        Nhấp để tải lên hoặc kéo thả
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">
                        PNG, JPG, WEBP (Tối đa 10MB/ảnh)
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-5 gap-4 mt-4">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative group aspect-square rounded-lg border border-outline-variant overflow-hidden bg-surface-container-low"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            {img.uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
                                </div>
                            )}
                            {idx === 0 && !img.uploading && (
                                <div className="absolute top-1 left-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Chính
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                {idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPrimary(idx); }}
                                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
                                        title="Đặt làm ảnh chính"
                                    >
                                        <span className="material-symbols-outlined text-sm text-primary">star</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
                                    title="Xoá ảnh"
                                >
                                    <span className="material-symbols-outlined text-sm text-error">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {slotsLeft > 0 && (
                        <button
                            type="button"
                            onClick={handleClick}
                            className="aspect-square rounded-lg border border-outline-variant border-dashed flex items-center justify-center hover:bg-surface-container-low transition-colors"
                        >
                            <span className="material-symbols-outlined text-on-surface-variant/40">add</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
