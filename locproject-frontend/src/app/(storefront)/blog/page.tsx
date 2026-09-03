'use client';

import Image from 'next/image';
import Navbar from '../../../components/storefront/layout/Navbar';
import Footer from '../../../components/storefront/layout/Footer';
import { usePublicBlogPosts } from '../../../lib/hooks/useMarketing';
import { resolveImageUrl } from '../../../lib/utils/imageUrl';

export default function BlogPage() {
  const { data: blogPosts = [], isLoading } = usePublicBlogPosts();

  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen pt-24 pb-20">
        {/* ── Page header ─────────────────────────────────────────── */}
        <section className="w-full pt-10 pb-12 md:pt-14 md:pb-16">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Journal</span>
            <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-2">
              Cẩm nang sức khỏe
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-4 max-w-2xl">
              Kiến thức dưỡng sinh, bí quyết chăm sóc sức khỏe và câu chuyện
              về thảo dược — được tuyển chọn bởi đội ngũ LocHerbal.
            </p>
          </div>
        </section>

        {/* ── Post list ───────────────────────────────────────────── */}
        <section className="w-full pb-16 md:pb-20">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-lg overflow-hidden border border-outline-variant/50 animate-pulse">
                    <div className="aspect-[16/9] bg-surface-container-high" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-surface-container-high rounded w-4/5" />
                      <div className="h-3 bg-surface-container-high rounded w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-primary-container/40 mb-4"
                      style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                <h2 className="font-headline-md text-headline-md text-primary">Chưa có bài viết nào</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Các bài viết sẽ sớm được cập nhật. Hãy quay lại sau nhé!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((post) => {
                  const img = resolveImageUrl(post.thumbnailUrl);
                  return (
                    <article key={post.id} className="group bg-surface-container-lowest rounded-lg overflow-hidden
                                                       border border-outline-variant/50 hover:shadow-botanical-hover
                                                       transition-shadow duration-300">
                      <div className="relative aspect-[16/9] bg-surface-container-high">
                        {img ? (
                          <Image src={img} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw"
                                 className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-primary-container/30"
                                  style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h2 className="font-headline-md text-headline-md text-on-surface line-clamp-2 leading-snug">
                          {post.title}
                        </h2>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mt-3">
                          {post.author?.fullName ?? 'LocHerbal'}
                          {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString('vi-VN')}` : ''}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
