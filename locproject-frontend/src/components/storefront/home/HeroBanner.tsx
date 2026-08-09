'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { StorefrontBanner } from '@/lib/hooks/useMarketing';

interface HeroBannerProps {
    banners?: StorefrontBanner[];
}

export default function HeroBanner({ banners = [] }: HeroBannerProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const items = banners.filter((b) => !b.linkUrl?.startsWith('/admin')).slice(0, 5);

    useEffect(() => {
        if (items.length < 2) return;
        timerRef.current = setInterval(() => {
            setActiveIdx((i) => (i + 1) % items.length);
        }, 6000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [items.length]);

    if (items.length === 0) {
        return <StaticHero />;
    }

    const goTo = (idx: number) => {
        setActiveIdx(idx);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setActiveIdx((i) => (i + 1) % items.length);
            }, 6000);
        }
    };

    const active = items[activeIdx];

    return (
        <section
            data-testid="hero-title"
            className="w-full bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale overflow-hidden"
        >
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-16 md:py-24">
                {/* Slide */}
                <BannerSlide active={active} />

                {/* Dots */}
                {items.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {items.map((b, idx) => (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => goTo(idx)}
                                aria-label={`Đến banner ${idx + 1}`}
                                className={`h-2 rounded-full transition-all ${
                                    idx === activeIdx ? 'w-8 bg-primary-700' : 'w-2 bg-primary-300/60 hover:bg-primary-400'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function BannerSlide({ active }: { active: StorefrontBanner }) {
    return (
        <div className="relative rounded-3xl overflow-hidden animate-fade-in-up shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageUrl} alt={active.title} className="w-full h-[320px] md:h-[420px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 max-w-xl">
                <p className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full bg-primary-100/90 text-primary-700 text-sm font-medium mb-4">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        eco
                    </span>
                    Thảo dược thiên nhiên
                </p>
                <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-[1.1] tracking-[-0.03em] mb-4 drop-shadow-sm">
                    {active.title}
                </h1>
                {active.linkUrl && (
                    <Link
                        href={active.linkUrl}
                        className="inline-flex items-center gap-2 w-fit px-7 py-3.5 rounded-full bg-white text-primary-700 font-semibold hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
                    >
                        Khám phá ngay
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

function StaticHero() {
    return (
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-16 md:py-24 lg:py-28
                        flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* ── LEFT: Text ─────────────────────────────────────── */}
            <div className="flex-1 text-center md:text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                                bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        eco
                    </span>
                    Thảo dược thiên nhiên
                </div>
                <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl
                               text-primary-700 leading-[1.1] tracking-[-0.03em] mb-6">
                    Chăm Sóc Sức Khỏe
                    <br />
                    <span className="text-primary-500">Từ Thiên Nhiên</span>
                </h1>
                <p className="text-text-secondary text-lg leading-relaxed max-w-lg mb-8 mx-auto md:mx-0">
                    Sản phẩm thảo dược cao cấp, được nghiên cứu theo y học cổ truyền kết hợp công nghệ hiện đại. Chăm sóc sức khỏe từ gốc rễ, bền vững và an toàn.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                                   bg-primary-700 text-white font-semibold text-base
                                   hover:bg-primary-800 hover:scale-[1.02] hover:shadow-lg
                                   transition-all duration-200 shadow-md"
                    >
                        <span className="material-symbols-outlined text-xl">storefront</span>
                        Khám phá sản phẩm
                    </Link>
                </div>
            </div>

            {/* ── RIGHT: Visual ──────────────────────────────────── */}
            <div className="flex-1 relative flex items-center justify-center" style={{ animationDelay: '200ms' }}>
                <div className="relative w-full max-w-sm md:max-w-md animate-scale-in" style={{ animationDelay: '200ms' }}>
                    <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary-100 via-primary-50 to-primary-200
                                    overflow-hidden shadow-xl flex items-center justify-center relative">
                        <div className="text-center p-8">
                            <span className="material-symbols-outlined text-primary-300" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>
                                local_pharmacy
                            </span>
                            <p className="text-primary-400 font-medium mt-4">Sản phẩm thảo dược thiên nhiên</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-200/30 to-transparent pointer-events-none" />
                    </div>
                    <div className="absolute -z-10 -bottom-8 -right-8 w-64 h-64 rounded-full bg-primary-100/60 blur-2xl" />
                    <div className="absolute -z-10 -top-8 -left-8 w-48 h-48 rounded-full bg-accent-gold-pale/80 blur-2xl" />
                </div>
            </div>
        </div>
    );
}