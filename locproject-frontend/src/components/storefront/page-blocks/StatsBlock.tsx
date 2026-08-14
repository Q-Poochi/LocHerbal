import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface StatsBlockProps {
    block: AdminPageBlock;
}

export default function StatsBlock({ block }: StatsBlockProps) {
    const c = block.content as Record<string, unknown>;
    const items = (Array.isArray(c.items) ? c.items : []) as { number?: string; label?: string }[];

    if (items.length === 0) return null;

    return (
        <section className="bg-primary-700">
            <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {items.map((item, idx) => (
                        <div key={idx} className="text-center">
                            <p className="font-display font-bold text-4xl md:text-5xl text-white">{item.number || ''}</p>
                            <p className="mt-2 text-sm md:text-base text-white/80">{item.label || ''}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}