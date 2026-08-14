import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface TimelineBlockProps {
    block: AdminPageBlock;
}

export default function TimelineBlock({ block }: TimelineBlockProps) {
    const c = block.content as Record<string, unknown>;
    const milestones = (Array.isArray(c.milestones) ? c.milestones : []) as {
        year?: string;
        title?: string;
        description?: string;
    }[];

    if (milestones.length === 0) return null;

    return (
        <section className="max-w-[850px] mx-auto px-4 md:px-10 py-14">
            <div className="relative">
                <div className="absolute left-[7px] md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2" />
                <div className="space-y-10">
                    {milestones.map((m, idx) => (
                        <div key={idx} className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
                            <span className="absolute left-0 md:left-1/2 top-1 w-[15px] h-[15px] rounded-full bg-primary border-4 border-white shadow -translate-x-1/2 z-10" />
                            <div className={`md:w-1/2 pl-8 md:pl-0 ${idx % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:ml-auto md:pl-10'}`}>
                                <p className="text-accent-gold font-bold text-sm">{m.year || ''}</p>
                                <h3 className="font-display font-semibold text-lg text-primary mt-1">{m.title || ''}</h3>
                                {m.description && (
                                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{m.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}