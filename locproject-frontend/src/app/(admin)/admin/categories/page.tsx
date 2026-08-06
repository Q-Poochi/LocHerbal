'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/error';

interface ApiCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    children?: ApiCategory[];
    attributes?: Array<Record<string, unknown>>;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editRow, setEditRow] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
    const pageSize = 6;

    const load = useCallback(async (p: number) => {
        try {
            setLoading(true);
            const res = await apiClient.get('/categories', { params: { page: p, limit: pageSize } });
            const data: ApiCategory[] = res.data?.data ?? [];
            setCategories(data.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                status: 'ACTIVE',
            })));
            setTotal(res.data?.total ?? data.length);
            setError('');
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể tải danh mục'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [page, load]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    function openEdit(c: Category) {
        setEditRow(c);
        setFormName(c.name);
        setFormSlug(c.slug);
        setFormStatus(c.status);
        setShowModal(true);
    }

    function openAdd() {
        setEditRow(null);
        setFormName('');
        setFormSlug('');
        setFormStatus('ACTIVE');
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const payload = { name: formName, slug: formSlug, status: formStatus };
            if (editRow) {
                await apiClient.put(`/categories/${editRow.id}`, payload);
            } else {
                await apiClient.post('/categories', payload);
            }
            setShowModal(false);
            load(page);
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể lưu danh mục'));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Xóa danh mục này?')) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            load(page);
        } catch (e) {
            setError(getErrorMessage(e, 'Không thể xóa danh mục'));
        }
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Danh mục</span>
            </nav>

            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-text-primary">Quản lý Danh mục</h2>
                <button onClick={openAdd}
                    className="flex items-center gap-1.5 bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm danh mục
                </button>
            </div>

            {error && (
                <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <span className="text-text-tertiary">Đang tải danh mục...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-primary text-white">
                                    <th className="px-5 py-4 text-left font-semibold text-[12px] uppercase tracking-wider">Tên danh mục</th>
                                    <th className="px-5 py-4 text-left font-semibold text-[12px] uppercase tracking-wider">Slug</th>
                                    <th className="px-5 py-4 text-center font-semibold text-[12px] uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-5 py-4 text-center font-semibold text-[12px] uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <p className="text-text-secondary">Chưa có danh mục nào.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((c) => (
                                        <tr key={c.id} className="hover:bg-surface-alt transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
                                                        <span className="material-symbols-outlined text-[20px]">category</span>
                                                    </div>
                                                    <span className="font-semibold text-text-primary text-sm">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-text-tertiary font-mono">{c.slug}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-border text-text-tertiary'}`}>
                                                    {c.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEdit(c)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors text-xs font-bold">
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        Sửa
                                                    </button>
                                                    <button onClick={() => handleDelete(c.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-error hover:bg-error-container transition-colors text-xs font-bold">
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-alt flex items-center justify-between border-t border-border">
                        <p className="text-xs text-text-tertiary">
                            <span className="font-semibold text-text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-text-primary">{Math.min(page * pageSize, total)}</span> / {total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-text-tertiary disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${p === page ? 'bg-primary-700 text-white shadow-sm' : 'hover:bg-white text-text-tertiary'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-text-tertiary disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary-700">category</span>
                            <h3 className="font-display font-bold text-lg text-text-primary">{editRow ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs text-text-tertiary font-bold mb-1.5">Tên danh mục</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10 outline-none text-sm" placeholder="VD: Trà thảo dược" />
                            </div>
                            <div>
                                <label className="block text-xs text-text-tertiary font-bold mb-1.5">Slug</label>
                                <input value={formSlug} onChange={(e) => setFormSlug(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10 outline-none text-sm" placeholder="VD: tra-thao-duoc" />
                            </div>
                            <div>
                                <label className="block text-xs text-text-tertiary font-bold mb-1.5">Trạng thái</label>
                                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10 outline-none text-sm bg-white">
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="INACTIVE">Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-border text-text-secondary font-semibold hover:bg-surface-alt transition-colors">
                                Hủy
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2.5 rounded-xl bg-primary-700 text-white font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50">
                                {saving ? 'Đang lưu...' : editRow ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
