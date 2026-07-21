'use client';

import { useState } from 'react';

export default function PublishSidebar() {
    const [isPublished, setIsPublished] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            {/* Status Card */}
            <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
                    <h3 className="font-label-bold text-label-bold text-primary">Trạng thái xuất bản</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-body-sm font-medium">Hiển thị website</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isPublished}
                                onChange={() => setIsPublished((p) => !p)}
                            />
                            <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-leaf" />
                        </label>
                    </div>
                    <div className="space-y-2 border-t border-outline-variant pt-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Ngày tạo:</span>
                            <span className="font-medium">12/10/2023 09:45</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">Cập nhật:</span>
                            <span className="font-medium">Chưa cập nhật</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button className="bg-surface-container-low text-primary border border-primary px-4 py-2.5 rounded-lg font-label-bold text-label-bold hover:bg-surface-container transition-colors">
                            Lưu nháp
                        </button>
                        <button className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-bold text-label-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                            Xuất bản
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Categories Card */}
            <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex justify-between items-center">
                    <h3 className="font-label-bold text-label-bold text-primary">Danh mục nhanh</h3>
                    <span className="material-symbols-outlined text-primary text-lg cursor-pointer">add</span>
                </div>
                <div className="p-6 space-y-3 max-h-60 overflow-y-auto">
                    {['Cao Dược Liệu', 'Trà Thảo Mộc', 'TP Chức Năng', 'Dược Mỹ Phẩm'].map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                defaultChecked={cat === 'Cao Dược Liệu'}
                                className="rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            <span className="text-body-sm">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Product Tags Card */}
            <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
                    <h3 className="font-label-bold text-label-bold text-primary">Từ khóa sản phẩm</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {['Atiso', 'Thảo dược', 'Sapa'].map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-fixed text-primary rounded-full text-xs font-bold"
                            >
                                {tag}
                                <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
                            </span>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3 text-sm"
                            placeholder="Thêm từ khóa..."
                            type="text"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase tracking-wider">
                            Thêm
                        </button>
                    </div>
                    <p className="font-caption text-caption text-on-surface-variant italic">
                        Nhập từ khóa và nhấn Enter để phân tách.
                    </p>
                </div>
            </div>

            {/* Additional Info Card */}
            <div className="lg:sticky lg:top-24 bg-surface-container-low rounded-xl p-6 border border-outline-variant/20 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-tighter">
                            Chứng nhận GACP
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                            Sản phẩm tuân thủ quy trình organic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}