'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface AttributeDefinition {
    key: string;
    label: string;
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    isRequired?: boolean;
    options?: string[];
}

export default function EAVAttributeForm({ categoryId }: { categoryId?: string }) {
    const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!categoryId) {
            setDefinitions([]);
            return;
        }
        setLoading(true);
        apiClient
            .get(`/categories/${categoryId}/attributes`)
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
                setDefinitions(data);
            })
            .catch(() => setDefinitions([]))
            .finally(() => setLoading(false));
    }, [categoryId]);

    if (!categoryId) {
        return (
            <div className="text-sm text-text-tertiary py-8 text-center">
                Vui lòng chọn danh mục để tải danh sách thuộc tính động.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-sm text-text-tertiary py-8 text-center">
                Đang tải thuộc tính...
            </div>
        );
    }

    if (definitions.length === 0) {
        return (
            <div className="text-sm text-text-tertiary py-8 text-center">
                Danh mục này chưa có thuộc tính động nào.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-6">
            {definitions.map((def) => (
                <div key={def.key} className="flex flex-col gap-1.5">
                    <label className="font-semibold text-sm text-text-tertiary">
                        {def.label}
                        {def.isRequired && <span className="text-error ml-0.5">*</span>}
                    </label>
                    {def.dataType === 'STRING' && (
                        <input
                            className="w-full rounded-lg border border-border focus:border-primary-700 focus:ring-1 focus:ring-primary-700/10 transition-all p-3"
                            placeholder={`Nhập ${def.label.toLowerCase()}...`}
                            type="text"
                        />
                    )}
                    {def.dataType === 'NUMBER' && (
                        <input
                            className="w-full rounded-lg border border-border focus:border-primary-700 focus:ring-1 focus:ring-primary-700/10 transition-all p-3"
                            placeholder="0"
                            type="number"
                        />
                    )}
                    {def.dataType === 'BOOLEAN' && (
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-border text-primary-700 focus:ring-primary-700"
                            />
                            <span className="text-sm text-text-tertiary">{def.label}</span>
                        </label>
                    )}
                    {def.dataType === 'SELECT' && (
                        <select className="w-full rounded-lg border border-border focus:border-primary-700 focus:ring-1 focus:ring-primary-700/10 transition-all p-3">
                            <option value="">Chọn {def.label.toLowerCase()}...</option>
                            {def.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
}
