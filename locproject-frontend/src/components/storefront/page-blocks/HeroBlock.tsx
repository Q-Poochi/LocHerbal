import Link from 'next/link';
import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface HeroBlockProps {
    block: AdminPageBlock;
}

export default function HeroBlock({ block }: HeroBlockProps) {
    const c = block.content as Record<string, unknown>;
    const title = (c.title as string) || '';
    const subtitle = (c.subtitle as string) || '';
    const bg = (c.backgroundImageUrl as string) || '';
    const ctaText = (c.ctaText as string) || '';
    const ctaLink = (c.ctaLink as string) || '/products';

    return (
        <section
            className="relative bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale"
        >
            {bg ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bg}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/45" />
                </>
            ) : null}
            <div className="relative max-w-[850px] mx-auto px-4 md:px-10 py-16 md:py-24 text-center">
                {title && (
                    <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-700 leading-tight tracking-tight mb-6">
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className={`text-lg leading-relaxed ${bg ? 'text-white' : 'text-text-secondary'}`}>{subtitle}</p>
                )}
                {ctaText && (
                    <Link
                        href={ctaLink}
                        className={`inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl font-label-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${
                            bg ? 'bg-white text-primary-700 hover:bg-white/90' : 'bg-primary text-white'
                        }`}
                    >
                        {ctaText}
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                )}
            </div>
        </section>
    );
}