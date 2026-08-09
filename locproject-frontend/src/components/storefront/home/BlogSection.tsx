'use client';

import Link from 'next/link';

interface BlogPostCard {
    id: string;
    category: string;
    title: string;
    excerpt: string;
    readTime: string;
    thumbnail?: string;
    slug?: string;
}

interface BlogPostInput {
    id: string;
    title: string;
    category?: { name?: string } | string | null;
    excerpt?: string;
    content?: string;
    readTime?: string;
    thumbnailUrl?: string;
    slug?: string;
}

export default function BlogSection({ posts = [] }: { posts: BlogPostInput[] }) {
    const items: BlogPostCard[] = posts.map((post) => ({
        id: post.id,
        category: typeof post.category === 'string' ? post.category : post.category?.name || 'Tin tức',
        title: post.title,
        excerpt: post.excerpt || post.content?.slice(0, 120) || '',
        readTime: post.readTime || `${Math.max(1, Math.ceil((post.content?.length || 0) / 1500))} phút đọc`,
        thumbnail: post.thumbnailUrl,
        slug: post.slug,
    }));

    return (
        <section className="w-full py-16 md:py-20 bg-white">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10">
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                            <span className="material-symbols-outlined text-base">menu_book</span>
                            Kiến thức sức khỏe
                        </div>
                        <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary tracking-tight">
                            Bài Viết Mới Nhất
                        </h2>
                    </div>
                    <Link href="/products" className="hidden md:flex items-center gap-1 text-primary-700 font-medium hover:underline text-sm">
                        Xem tất cả
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </Link>
                </div>

                {/* Cards */}
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">menu_book</span>
                        <p className="text-text-secondary font-medium">Chưa có bài viết nào.</p>
                        <p className="text-sm text-text-tertiary mt-1">Nội dung kiến thức sức khỏe sẽ sớm được cập nhật.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 stagger-children">
                        {items.map((post) => (
                            <article
                                key={post.id}
                                className="group bg-white rounded-2xl border border-border overflow-hidden
                                         hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="aspect-video bg-primary-50 flex items-center justify-center relative overflow-hidden">
                                    {post.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={post.thumbnail}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                                        />
                                    ) : (
                                        <span
                                            className="material-symbols-outlined text-primary-200 group-hover:scale-110 transition-transform duration-400"
                                            style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}
                                        >
                                            favorite
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-100 text-primary-700">
                                            {post.category}
                                        </span>
                                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {post.readTime}
                                        </span>
                                    </div>
                                    <h3 className="font-display font-semibold text-base text-text-primary line-clamp-2 mb-2
                                                   group-hover:text-primary-700 transition-colors leading-snug">
                                        {post.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-4 flex items-center gap-1 text-primary-700 text-sm font-medium">
                                        Đọc tiếp
                                        <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
