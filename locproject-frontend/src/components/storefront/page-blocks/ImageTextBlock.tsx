import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

interface ImageTextBlockProps {
    block: AdminPageBlock;
}

export default function ImageTextBlock({ block }: ImageTextBlockProps) {
    const c = block.content as Record<string, unknown>;
    const imageUrl = (c.imageUrl as string) || '';
    const imagePosition = (c.imagePosition as string) === 'right' ? 'right' : 'left';
    const heading = (c.heading as string) || '';
    const body = (c.body as string) || '';

    const image = imageUrl ? (
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={heading} className="w-full h-full object-cover" />
        </div>
    ) : null;

    const text = (
        <div className="flex flex-col justify-center">
            {heading && <h2 className="font-display font-semibold text-3xl text-primary mb-4">{heading}</h2>}
            {body && <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-line">{body}</p>}
        </div>
    );

    return (
        <section className="max-w-[1100px] mx-auto px-4 md:px-10 py-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
                {imagePosition === 'left' ? (
                    <>
                        <div className="order-2 md:order-1">{image}</div>
                        <div className="order-1 md:order-2">{text}</div>
                    </>
                ) : (
                    <>
                        <div>{text}</div>
                        <div>{image}</div>
                    </>
                )}
            </div>
        </section>
    );
}