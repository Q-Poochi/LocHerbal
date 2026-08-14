'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024;

interface SingleImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

export default function SingleImageUploader({ value, onChange, label = 'Hình ảnh' }: SingleImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('files', file);
        try {
            const { data } = await apiClient.post<{ url: string }[]>('/upload', formData);
            onChange(data[0]?.url ?? '');
        } catch {
            // bỏ qua lỗi upload
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface-variant">{label}</label>
            <div className="flex items-start gap-3">
                {value ? (
                    <div className="relative w-28 h-20 rounded-lg border border-outline-variant overflow-hidden bg-surface-container-low group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xoá ảnh"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="w-28 h-20 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">
                            {uploading ? 'progress_activity' : 'add_photo_alternate'}
                        </span>
                        <span className="text-[11px] font-medium">{uploading ? 'Đang tải...' : 'Tải ảnh'}</span>
                    </button>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.gif"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>
        </div>
    );
}
