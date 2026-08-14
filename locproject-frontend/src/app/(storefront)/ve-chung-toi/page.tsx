import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import { renderPageBlock } from '@/components/storefront/page-blocks/renderPageBlock';
import type { AdminPageBlock } from '@/lib/hooks/useMarketing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAboutBlocks(): Promise<AdminPageBlock[]> {
    try {
        const res = await fetch(`${API_URL}/pages/about-us/blocks`, {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        return (await res.json()) as AdminPageBlock[];
    } catch {
        return [];
    }
}

export default async function AboutPage() {
    const blocks = await getAboutBlocks();

    return (
        <>
            <Navbar />
            <main className="pb-16 md:pb-0">
                {blocks.length === 0 ? (
                    <section className="bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale">
                        <div className="max-w-[850px] mx-auto px-4 md:px-10 py-16 md:py-24 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                                <span className="material-symbols-outlined text-base">eco</span>
                                Thảo dược thiên nhiên
                            </div>
                            <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-700 leading-tight tracking-tight mb-6">
                                Về LocHerbal
                            </h1>
                            <p className="text-text-secondary text-lg leading-relaxed">
                                Giải pháp thảo dược hiện đại cho sức khỏe truyền thống người Việt.
                            </p>
                        </div>
                    </section>
                ) : (
                    blocks.map((block) => renderPageBlock(block, block.id))
                )}
            </main>
            <Footer />
        </>
    );
}