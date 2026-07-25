'use client';

import { useState, useMemo } from 'react';

interface Category {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    status: 'ACTIVE' | 'INACTIVE';
}

const mock: Category[] = [
    { id: '1', name: 'Trà thảo dược', slug: 'tra-thao-duoc', productCount: 24, status: 'ACTIVE' },
    { id: '2', name: 'Cao thảo dược', slug: 'cao-thao-duoc', productCount: 15, status: 'ACTIVE' },
    { id: '3', name: 'Viên uống', slug: 'vien-uong', productCount: 30, status: 'ACTIVE' },
    { id: '4', name: 'Tinh dầu', slug: 'tinh-dau', productCount: 8, status: 'ACTIVE' },
    { id: '5', name: 'Dung dịch vệ sinh', slug: 'dung-dich-ve-sinh', productCount: 12, status: 'ACTIVE' },
    { id: '6', name: 'Sản phẩm da liễu', slug: 'san-pham-da-lieu', productCount: 6, status: 'INACTIVE' },
    { id: '7', name: 'Thực phẩm chức năng', slug: 'thuc-pham-chuc-nang', productCount: 20, status: 'ACTIVE' },
    { id: '8', name: 'Bộ sản phẩm', slug: 'bo-san-pham', productCount: 5, status: 'ACTIVE' },
];

export default function CategoriesPage() {
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editRow, setEditRow] = useState<Category | null>(null);
    const pageSize = 6;

    const totalPages = Math.ceil(mock.length / pageSize);
    const paged = mock.slice((page - 1) * pageSize, page * pageSize);

    function openEdit(c: Category) {
        setEditRow(c);
        setShowModal(true);
    }

    function openAdd() {
        setEditRow(null);
        setShowModal(true);
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto w-full">
            <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-1">
                <span className="material-symbols-outlined text-[16px]">store</span>
                <span>Bán hàng</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Danh mục</span>
            </nav>

            <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-lg text-headline-lg text-primary">Quản lý Danh mục</h2>
                <button onClick={openAdd}
                    className="flex items-center gap-1.5 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm danh mục
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(27,67,50,0.06)] border border-outline-variant/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary text-white">
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Tên danh mục</th>
                                <th className="px-5 py-4 text-left font-label-bold text-[12px] uppercase tracking-wider">Slug</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Trạng thái</th>
                                <th className="px-5 py-4 text-center font-label-bold text-[12px] uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {paged.map((c) => (
                                <tr key={c.id} className="hover:bg-surface-container-lowest/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[20px]">category</span>
                                            </div>
                                            <span className="font-label-bold text-primary text-body-sm">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-body-sm text-on-surface-variant font-mono">{c.slug}</td>
                                    <td className="px-5 py-4 text-center text-body-sm font-bold">{c.productCount}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-outline-variant text-outline'}`}>
                                            {c.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => openEdit(c)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors text-caption font-bold">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                                Sửa
                                            </button>
                                            <button
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-caption font-bold">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
                        <p className="text-caption text-on-surface-variant">
                            <span className="font-semibold text-primary">{(page - 1) * pageSize + 1}</span>–<span className="font-semibold text-primary">{Math.min(page * pageSize, mock.length)}</span> / {mock.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${p === page ? 'bg-primary text-white shadow-sm' : 'hover:bg-white text-on-surface-variant'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white text-on-surface-variant disabled:opacity-30 transition-colors">
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
                            <span className="material-symbols-outlined text-primary">category</span>
                            <h3 className="font-headline-md text-headline-md text-primary">{editRow ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Tên danh mục</label>
                                <input className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm" placeholder="VD: Trà thảo dược" defaultValue={editRow?.name || ''} />
                            </div>
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Slug</label>
                                <input className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm" placeholder="VD: tra-thao-duoc" defaultValue={editRow?.slug || ''} />
                            </div>
                            <div>
                                <label className="block text-caption text-on-surface-variant font-bold mb-1.5">Trạng thái</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-body-sm bg-white" defaultValue={editRow?.status || 'ACTIVE'}>
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="INACTIVE">Ngừng hoạt động</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-8">
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-label-bold hover:bg-surface-container-low transition-colors">
                                Hủy
                            </button>
                            <button onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 transition-all shadow-sm shadow-primary/20">
                                {editRow ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
