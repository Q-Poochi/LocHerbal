'use client';

import { useState } from 'react';
import type { PageBlockType } from '@/lib/hooks/useMarketing';
import { PAGE_BLOCK_TYPE_LABELS } from '@/lib/hooks/useMarketing';

const PREVIEWS: Record<PageBlockType, string> = {
    hero: 'Ảnh nền lớn + tiêu đề + nút CTA',
    text: 'Tiêu đề + đoạn văn',
    'image-text': 'Ảnh minh hoạ + văn bản cạnh nhau',
    stats: 'Dãy số liệu thống kê (200+, 50K+, ...)',
    team: 'Danh sách thành viên với avatar',
    timeline: 'Các mốc phát triển theo năm',
};

const ICONS: Record<PageBlockType, string> = {
    hero: 'image',
    text: 'notes',
    'image-text': 'view_sidebar',
    stats: 'monitoring',
    team: 'group',
    timeline: 'timeline',
};

interface AddBlockModalProps {
    open: boolean;
    submitting: boolean;
    onSelect: (type: PageBlockType) => void;
    onClose: () => void;
}

export default function AddBlockModal({ open, submitting, onSelect, onClose }: AddBlockModalProps) {
    const [selected, setSelected] = useState<PageBlockType | null>(null);
    if (!open) return null;

    const types = Object.keys(PAGE_BLOCK_TYPE_LABELS) as PageBlockType[];

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-label-bold text-label-bold text-primary">Thêm khối mới</h3>
                        <p className="text-sm text-on-surface-variant mt-1">Chọn loại nội dung cho khối này.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-lg"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {types.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setSelected(t)}
                            className={`text-left border-2 rounded-xl p-4 flex items-start gap-3 transition-all ${
                                selected === t
                                    ? 'border-primary bg-primary/5'
                                    : 'border-outline-variant hover:border-primary/50 hover:bg-surface-alt'
                            }`}
                        >
                            <span className="material-symbols-outlined text-primary mt-0.5">{ICONS[t]}</span>
                            <span>
                                <span className="block font-semibold text-primary text-sm">{PAGE_BLOCK_TYPE_LABELS[t]}</span>
                                <span className="block text-xs text-on-surface-variant mt-0.5">{PREVIEWS[t]}</span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        onClick={() => selected && onSelect(selected)}
                        disabled={!selected || submitting}
                        className="admin-btn admin-btn-primary"
                    >
                        {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                        Thêm khối
                    </button>
                </div>
            </div>
        </div>
    );
}