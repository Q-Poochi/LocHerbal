'use client';

import { useState } from 'react';
import type { AdminPageBlock, PageBlockType } from '@/lib/hooks/useMarketing';
import SingleImageUploader from './single-image-uploader/SingleImageUploader';

interface BlockFormProps {
    block: AdminPageBlock;
    onSubmit: (content: Record<string, unknown>) => void;
    onCancel: () => void;
    submitting: boolean;
}

type ListField = { label: string; key: string; type?: 'text' | 'textarea' | 'avatar' };

type ListItem = {
    label: string;
    fields: ListField[];
    listKey: string;
};

const LIST_CONFIG: Partial<Record<PageBlockType, ListItem>> = {
    stats: {
        label: 'Số liệu',
        listKey: 'items',
        fields: [
            { label: 'Số', key: 'number' },
            { label: 'Nhãn', key: 'label' },
        ],
    },
    team: {
        label: 'Thành viên',
        listKey: 'members',
        fields: [
            { label: 'Họ tên', key: 'name' },
            { label: 'Chức danh', key: 'role' },
            { label: 'Ảnh đại diện', key: 'avatarUrl', type: 'avatar' },
            { label: 'Giới thiệu', key: 'bio', type: 'textarea' },
        ],
    },
    timeline: {
        label: 'Mốc phát triển',
        listKey: 'milestones',
        fields: [
            { label: 'Năm', key: 'year' },
            { label: 'Tiêu đề', key: 'title' },
            { label: 'Mô tả', key: 'description', type: 'textarea' },
        ],
    },
};

export default function BlockForm({ block, onSubmit, onCancel, submitting }: BlockFormProps) {
    const [content, setContent] = useState<Record<string, unknown>>({ ...(block.content as Record<string, unknown>) });

    const setField = (key: string, value: unknown) => setContent((prev) => ({ ...prev, [key]: value }));

    const listConfig = LIST_CONFIG[block.type] as ListItem | undefined;
    const listKey = listConfig?.listKey ?? '';
    const list = Array.isArray(content[listKey]) ? (content[listKey] as Record<string, unknown>[]) : [];

    const updateListItem = (idx: number, key: string, value: string) => {
        const updated = list.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
        setField(listConfig!.listKey, updated);
    };

    const addListItem = () => {
        const empty = Object.fromEntries(listConfig!.fields.map((f) => [f.key, '']));
        setField(listConfig!.listKey, [...list, empty]);
    };

    const removeListItem = (idx: number) => {
        setField(listConfig!.listKey, list.filter((_, i) => i !== idx));
    };

    const textField = (label: string, key: string, value: string, type: 'text' | 'textarea' = 'text') => (
        <div key={key}>
            <label className="font-label-bold text-label-bold text-on-surface-variant block mb-1">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    rows={4}
                    value={value || ''}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            ) : (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            )}
        </div>
    );

    const renderSimpleFields = () => {
        switch (block.type) {
            case 'hero':
                return (
                    <div className="space-y-4">
                        <SingleImageUploader
                            label="Ảnh nền"
                            value={(content.backgroundImageUrl as string) || ''}
                            onChange={(url) => setField('backgroundImageUrl', url)}
                        />
                        {textField('Tiêu đề', 'title', content.title as string)}
                        {textField('Mô tả ngắn', 'subtitle', content.subtitle as string, 'textarea')}
                        {textField('Nút CTA — nhãn', 'ctaText', content.ctaText as string)}
                        {textField('Nút CTA — đường dẫn', 'ctaLink', content.ctaLink as string)}
                    </div>
                );
            case 'text':
                return (
                    <div className="space-y-4">
                        {textField('Tiêu đề', 'heading', content.heading as string)}
                        {textField('Nội dung', 'body', content.body as string, 'textarea')}
                    </div>
                );
            case 'image-text':
                return (
                    <div className="space-y-4">
                        <SingleImageUploader
                            label="Ảnh minh hoạ"
                            value={(content.imageUrl as string) || ''}
                            onChange={(url) => setField('imageUrl', url)}
                        />
                        <div>
                            <label className="font-label-bold text-label-bold text-on-surface-variant block mb-1">Vị trí ảnh</label>
                            <div className="flex gap-3">
                                {['left', 'right'].map((pos) => (
                                    <label key={pos} className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="imagePosition"
                                            checked={(content.imagePosition as string) === pos}
                                            onChange={() => setField('imagePosition', pos)}
                                        />
                                        <span className="text-sm">{pos === 'left' ? 'Ảnh bên trái' : 'Ảnh bên phải'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {textField('Tiêu đề', 'heading', content.heading as string)}
                        {textField('Nội dung', 'body', content.body as string, 'textarea')}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderList = () => {
        if (!listConfig) return null;
        return (
            <div className="space-y-4">
                {list.map((item, idx) => (
                    <div key={idx} className="border border-outline-variant rounded-xl p-4 space-y-3 relative">
                        <button
                            type="button"
                            onClick={() => removeListItem(idx)}
                            className="absolute top-2 right-2 w-7 h-7 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg flex items-center justify-center"
                            title="Xoá mục"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        {listConfig.fields.map((f) =>
                            f.type === 'avatar' ? (
                                <SingleImageUploader
                                    key={f.key}
                                    label={f.label}
                                    value={(item[f.key] as string) || ''}
                                    onChange={(url) => updateListItem(idx, f.key, url)}
                                />
                            ) : (
                                <div key={f.key}>
                                    <label className="font-label-bold text-label-bold text-on-surface-variant block mb-1">{f.label}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea
                                            rows={3}
                                            value={(item[f.key] as string) || ''}
                                            onChange={(e) => updateListItem(idx, f.key, e.target.value)}
                                            className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={(item[f.key] as string) || ''}
                                            onChange={(e) => updateListItem(idx, f.key, e.target.value)}
                                            className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                        />
                                    )}
                                </div>
                            ),
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addListItem}
                    className="w-full py-2.5 rounded-lg border-2 border-dashed border-outline-variant text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm {listConfig.label.toLowerCase()}
                </button>
            </div>
        );
    };

    return (
        <div>
            {listConfig ? renderList() : renderSimpleFields()}
            <div className="flex justify-end gap-2 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                    Huỷ
                </button>
                <button
                    type="button"
                    onClick={() => onSubmit(content)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                    {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                    Lưu
                </button>
            </div>
        </div>
    );
}