import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface TextBlockProps {
    block: AdminPageBlock;
}

export default function TextBlock({ block }: TextBlockProps) {
    const c = block.content as Record<string, unknown>;
    const heading = (c.heading as string) || '';
    const body = (c.body as string) || '';

    return (
        <section className="max-w-[850px] mx-auto px-4 md:px-10 py-14">
            {heading && (
                <h2 className="font-display font-semibold text-3xl text-primary mb-5">{heading}</h2>
            )}
            {body && (
                <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-line">{body}</p>
            )}
        </section>
    );
}