'use client';

/**
 * Motion utilities — CSS + IntersectionObserver, KHÔNG dùng thư viện ngoài
 * (framer-motion không có trong project; bundle không tăng).
 *
 * Nguyên tắc:
 * - Chỉ animate transform/opacity (GPU-friendly, không layout thrash).
 * - Server render trạng thái CUỐI (text hiển thị trong view-source, SEO an toàn,
 *   không-JS vẫn đọc được); trạng thái ẩn chỉ áp sau hydration rồi reveal.
 * - prefers-reduced-motion: CSS force hiển thị ngay, JS cũng skip animation.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** IntersectionObserver once — trả về trạng thái đã vào viewport. */
function useInView<T extends HTMLElement>() {
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
            // Trigger sớm hơn chút để animation bắt đầu khi element vừa lọt màn hình
            { rootMargin: '0px 0px -10% 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

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

/**
 * StaggerReveal — container vào viewport thì các con trực tiếp lần lượt
 * hiện ra (delay theo nth-child, định nghĩa trong globals.css).
 * LƯU Ý: giữ nguyên className của caller (vd: grid classes) để không vỡ layout.
 */
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

/**
 * AnimatedCounter — đếm từ 0 đến `value` bằng rAF khi vào viewport.
 * SSR + no-JS hiển thị GIÁ TRỊ CUỐI (không bao giờ hiện "0" trong view-source).
 */
export function AnimatedCounter({
    value,
    suffix = '',
    duration = 1200,
    className = '',
}: {
    value: number;
    suffix?: string;
    duration?: number;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLSpanElement>();
    // null = chưa animate → hiển thị giá trị cuối (SSR/no-JS/reduced-motion)
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
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            setDisplay(Math.round(value * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, value, duration]);

    const shown = display ?? value;
    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {shown.toLocaleString('vi-VN')}
            {suffix}
        </span>
    );
}

/**
 * HeroTextReveal — các dòng text hiện lần lượt ngay khi mount (above-the-fold,
 * không cần IO). SSR hiển thị đầy đủ; sau hydration mới ẩn rồi chạy vào.
 */
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
                    // --line-i: delay stagger theo dòng (CSS calc)
                    style={{ '--line-i': i } as React.CSSProperties}
                >
                    {line}
                </span>
            ))}
        </span>
    );
}