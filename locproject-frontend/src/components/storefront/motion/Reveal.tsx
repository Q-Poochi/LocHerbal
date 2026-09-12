'use client';

/**
 * Motion utilities — CSS + IntersectionObserver, ZERO DEPENDENCY
 * Lusion.co-inspired scroll motion system.
 */

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** IntersectionObserver once — trả về trạng thái đã vào viewport. */
export function useInView<T extends HTMLElement>(rootMargin = '0px 0px -10% 0px') {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (prefersReducedMotion()) {
            setInView(true);
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setInView(true);
                    io.disconnect();
                }
            },
            { rootMargin },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin]);

    return { ref, inView };
}

/** Reveal đơn — fade + translateY khi vào viewport. */
export function Reveal({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>();
    return (
        <div ref={ref} className={`reveal ${inView ? 'is-visible' : ''} ${className}`}>
            {children}
        </div>
    );
}

/** StaggerReveal — container vào viewport thì các con trực tiếp lần lượt hiện ra. */
export function StaggerReveal({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>();
    return (
        <div ref={ref} className={`reveal-stagger ${inView ? 'is-visible' : ''} ${className}`}>
            {children}
        </div>
    );
}

/** MaskedTextReveal — Kinetic typography trồi lên từ mask. */
export function MaskedTextReveal({
    lines,
    className = '',
    delayStart = 0,
}: {
    lines: (string | ReactNode)[];
    className?: string;
    delayStart?: number;
}) {
    const { ref, inView } = useInView<HTMLDivElement>('0px 0px -5% 0px');

    return (
        <div ref={ref} className={`${inView ? 'is-visible' : ''} ${className}`}>
            {lines.map((line, idx) => (
                <span key={idx} className="masked-line-wrap">
                    <span
                        className="masked-line-inner"
                        style={{
                            transitionDelay: `${delayStart + idx * 120}ms`,
                        }}
                    >
                        {line}
                    </span>
                </span>
            ))}
        </div>
    );
}

/** CurtainMediaReveal — Khung ngoài bung mở bằng clip-path, media zoom-out. */
export function CurtainMediaReveal({
    children,
    className = '',
    aspect = 'aspect-[16/9]',
}: {
    children: ReactNode;
    className?: string;
    aspect?: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>('0px 0px -8% 0px');

    return (
        <div
            ref={ref}
            className={`curtain-frame ${aspect} ${inView ? 'is-visible' : ''} ${className}`}
        >
            <div className="w-full h-full curtain-inner">
                {children}
            </div>
        </div>
    );
}

/** ScrollExpandMedia — Container tự động mở rộng (scale up & expand) khi cuộn vào tâm màn hình. */
export function ScrollExpandMedia({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>('0px 0px -15% 0px');

    return (
        <div
            ref={ref}
            className={`scroll-expand-container ${inView ? 'is-expanded' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

/** TiltCard — Card có hiệu ứng nghiêng 3D vi mô khi rê chuột. */
export function TiltCard({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState({});

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || prefersReducedMotion()) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
        const rotateY = ((x - centerX) / centerX) * 6;
        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
        });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className={`tilt-card ${className}`}
        >
            {children}
        </div>
    );
}

/** MarqueeTicker — Dải chạy vô tận các biểu tượng, tiêu chuẩn hoặc chứng nhận. */
export function MarqueeTicker({
    items,
    className = '',
}: {
    items: { label: string; icon?: string }[];
    className?: string;
}) {
    const quadrupled = [...items, ...items, ...items, ...items];

    return (
        <div className={`overflow-hidden select-none py-4 border-y border-outline-variant/30 ${className}`}>
            <div className="animate-marquee gap-8 md:gap-12 items-center">
                {quadrupled.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3 shrink-0 text-on-surface-variant font-label-caps text-sm tracking-wider uppercase">
                        {it.icon && (
                            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {it.icon}
                            </span>
                        )}
                        <span>{it.label}</span>
                        <span className="text-tertiary/40 ml-4 font-serif">•</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** AnimatedCounter — đếm từ 0 đến `value` bằng rAF. */
export function AnimatedCounter({
    value,
    suffix = '',
    duration = 1400,
    className = '',
}: {
    value: number;
    suffix?: string;
    duration?: number;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLSpanElement>();
    const [display, setDisplay] = useState<number | null>(null);

    useEffect(() => {
        if (!inView || display !== null) return;
        if (prefersReducedMotion()) {
            setDisplay(value);
            return;
        }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(value * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, duration]);

    const shown = display ?? value;
    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {shown.toLocaleString('vi-VN')}
            {suffix}
        </span>
    );
}

/** HeroTextReveal — các dòng text hiện lần lượt ngay khi mount. */
export function HeroTextReveal({
    lines,
    className = '',
}: {
    lines: ReactNode[];
    className?: string;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <span className={`hero-reveal ${mounted ? 'is-mounted' : ''} ${className}`}>
            {lines.map((line, i) => (
                <span
                    key={i}
                    className="hero-line"
                    style={{ '--line-i': i } as React.CSSProperties}
                >
                    {line}
                </span>
            ))}
        </span>
    );
}
