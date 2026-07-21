'use client';

import { useState } from 'react';
import { ProductDetail } from '../../../types/api.types';

interface ProductTabsProps {
    product: ProductDetail;
}

type TabId = 'description' | 'details' | 'usage' | 'reviews';

export default function ProductTabs({ product }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('description');

    const tabs: { id: TabId; label: string }[] = [
        { id: 'description', label: 'Mô tả sản phẩm' },
        { id: 'details', label: 'Thông tin chi tiết' },
        { id: 'usage', label: 'Hướng dẫn sử dụng' },
        { id: 'reviews', label: `Đánh giá (${product.reviewCount})` },
    ];

    return (
        <div className="mb-16">
            {/* Tab Headers */}
            <div className="flex border-b border-outline-variant mb-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`px-8 py-4 font-bold whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-outline hover:text-primary'
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'description' && (
                        <>
                            <section className="space-y-4">
                                <h2 className="font-headline-md text-headline-md text-primary font-bold">Giới thiệu sản phẩm</h2>
                                <p className="text-body-lg text-on-surface-variant leading-relaxed">{product.description}</p>
                                <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                    <p className="font-body-md italic text-primary">
                                        "Sứ mệnh của chúng tôi là mang lại trái tim khỏe mạnh cho hàng triệu người dân Việt Nam thông qua những tinh túy từ thiên nhiên quê hương."
                                    </p>
                                </div>
                            </section>
                            <section className="space-y-6">
                                <h3 className="font-headline-md text-[20px] text-primary font-bold">Lợi ích vượt trội</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.benefits?.map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-3 p-4 bg-surface-white shadow-sm rounded-lg border border-outline-variant/30">
                                            <span className="material-symbols-outlined text-success-leaf">check_circle</span>
                                            <p className="text-body-sm font-medium">{benefit}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'details' && (
                        <section className="space-y-4">
                            <h2 className="font-headline-md text-headline-md text-primary font-bold">Thông số kỹ thuật</h2>
                            <div className="bg-surface-white border border-outline-variant/50 rounded-xl p-6 shadow-sm">
                                <div className="space-y-3">
                                    {product.specifications?.map((spec, index) => (
                                        <div key={index} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-b-0">
                                            <span className="text-outline text-body-sm">{spec.label}</span>
                                            <span className="font-bold text-body-sm">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'usage' && (
                        <section className="space-y-4">
                            <h2 className="font-headline-md text-headline-md text-primary font-bold">Hướng dẫn sử dụng</h2>
                            <div className="p-6 bg-secondary/5 border border-secondary/20 rounded-xl">
                                <h3 className="font-bold text-secondary mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined">lightbulb</span>
                                    Mẹo sử dụng
                                </h3>
                                <p className="text-caption text-secondary/80 leading-relaxed">{product.usageTips}</p>
                            </div>
                        </section>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="text-center py-8 text-outline">
                            <span className="material-symbols-outlined text-[48px]">reviews</span>
                            <p className="mt-2">Xem phần đánh giá bên dưới</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Specifications (always visible on desktop) */}
                <div className="hidden lg:block space-y-6">
                    <div className="p-6 bg-surface-white border border-outline-variant/50 rounded-xl shadow-sm">
                        <h3 className="font-bold text-primary mb-4">Thông số kỹ thuật</h3>
                        <div className="space-y-3">
                            {product.specifications?.map((spec, index) => (
                                <div key={index} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-b-0">
                                    <span className="text-outline text-body-sm">{spec.label}</span>
                                    <span className="font-bold text-body-sm">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-secondary/5 border border-secondary/20 rounded-xl">
                        <h3 className="font-bold text-secondary mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">lightbulb</span>
                            Mẹo sử dụng
                        </h3>
                        <p className="text-caption text-secondary/80 leading-relaxed">{product.usageTips}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}