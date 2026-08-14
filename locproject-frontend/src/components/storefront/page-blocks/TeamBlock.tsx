import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface TeamBlockProps {
    block: AdminPageBlock;
}

export default function TeamBlock({ block }: TeamBlockProps) {
    const c = block.content as Record<string, unknown>;
    const members = (Array.isArray(c.members) ? c.members : []) as {
        name?: string;
        role?: string;
        avatarUrl?: string;
        bio?: string;
    }[];

    if (members.length === 0) return null;

    return (
        <section className="max-w-[1100px] mx-auto px-4 md:px-10 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {members.map((m, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-primary-fixed bg-surface-container-low">
                            {m.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.avatarUrl} alt={m.name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-primary/50">person</span>
                                </div>
                            )}
                        </div>
                        <h3 className="font-display font-semibold text-lg text-primary">{m.name || ''}</h3>
                        <p className="text-sm text-accent-gold font-medium mt-0.5">{m.role || ''}</p>
                        {m.bio && <p className="text-sm text-text-secondary mt-3 leading-relaxed">{m.bio}</p>}
                    </div>
                ))}
            </div>
        </section>
    );
}