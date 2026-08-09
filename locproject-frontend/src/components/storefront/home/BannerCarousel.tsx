'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { StorefrontBanner } from '@/lib/hooks/useMarketing';

interface BannerCarouselProps {
    banners?: StorefrontBanner[];
}

export default function BannerCarousel({ banners = [] }: BannerCarouselProps) {
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

    if (items.length === 0) return null;

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
        <section data-testid="banner-carousel" className="w-full bg-background">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 pb-2">
                <div className="relative rounded-3xl overflow-hidden animate-fade-in-up shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={active.imageUrl}
                        alt={active.title}
                        className="w-full h-[300px] md:h-[380px] object-cover"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                    {active.linkUrl ? (
                        <Link
                            href={active.linkUrl}
                            className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 max-w-xl"
                        >
                            <p className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full bg-primary-100/90 text-primary-700 text-sm font-medium mb-4">
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    eco
                                </span>
                                Thảo dược thiên nhiên
                            </p>
                            <h2 className="font-display font-bold text-3xl md:text-5xl text-white leading-[1.1] tracking-[-0.03em] mb-4 drop-shadow-sm">
                                {active.title}
                            </h2>
                            <span className="inline-flex items-center gap-2 w-fit px-7 py-3.5 rounded-full bg-white text-primary-700 font-semibold hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                                Khám phá ngay
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </span>
                        </Link>
                    ) : (
                        <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 max-w-xl">
                            <p className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full bg-primary-100/90 text-primary-700 text-sm font-medium mb-4">
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    eco
                                </span>
                                Thảo dược thiên nhiên
                            </p>
                            <h2 className="font-display font-bold text-3xl md:text-5xl text-white leading-[1.1] tracking-[-0.03em] mb-4 drop-shadow-sm">
                                {active.title}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Dots */}
                {items.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
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