'use client';

import { useState } from 'react';
import Image from 'next/image';
import Navbar from '../../../components/storefront/layout/Navbar';
import Footer from '../../../components/storefront/layout/Footer';
import { usePublicBlogPosts } from '../../../lib/hooks/useMarketing';
import { resolveImageUrl } from '../../../lib/utils/imageUrl';
import {
  CurtainMediaReveal,
  HeroTextReveal,
  MaskedTextReveal,
  MarqueeTicker,
  Reveal,
  ScrollExpandMedia,
  StaggerReveal,
  TiltCard,
} from '../../../components/storefront/motion/Reveal';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export default function BlogPage() {
  const { data: blogPosts = [], isLoading } = usePublicBlogPosts();
  const [selectedTag, setSelectedTag] = useState('Tất cả');

  const categories = [
    'Tất cả',
    'Dược Liệu Bản Địa',
    'Dưỡng Sinh Cổ Truyền',
    'Trà & Tinh Dầu',
    'Khoa Học Thảo Mộc',
    'Lối Sống Lành',
  ];

  const blogMarquee = [
    { label: 'Cẩm Nang Dưỡng Sinh Số Mới Nhất', icon: 'auto_stories' },
    { label: 'Kiến Thức Y Dược Được Kiểm Duyệt', icon: 'verified' },
    { label: 'Thảo Mộc Chữa Lành Thân Tâm', icon: 'spa' },
    { label: 'Góc Nhìn Chuyên Gia Dược Sĩ', icon: 'psychology' },
  ];

  const featuredPost = blogPosts.length > 0 ? blogPosts[0] : null;
  const secondaryPost = blogPosts.length > 1 ? blogPosts[1] : null;
  const regularPosts = blogPosts.length > 2 ? blogPosts.slice(2) : [];

  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen pt-24 pb-20 bg-transparent">
        {/* ━━━ 1. HERO MAGAZINE HEADER ━━━ */}
        <section className="w-full pt-10 pb-10 md:pt-16 md:pb-14">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-secondary/30 text-secondary font-label-caps text-label-caps uppercase tracking-[0.14em] bg-white/50 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">auto_stories</span>
              LocHerbal Journal & Editorial
            </span>
            <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-4 font-bold tracking-tight">
              <HeroTextReveal lines={['Cẩm Nang Sức Khỏe', 'Tri Thức Dưỡng Sinh']} />
            </h1>
            <div className="mt-4 max-w-2xl">
              <MaskedTextReveal
                className="font-body-md text-body-md text-on-surface-variant leading-relaxed"
                lines={[
                  'Những chuyên đề chuyên sâu về dược học bản địa, phương pháp trị liệu',
                  'tự nhiên và cảm hứng sống hài hòa cùng cỏ cây — đúc kết bởi đội ngũ LocHerbal.',
                ]}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2.5 mt-8 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedTag(cat)}
                  className={`px-5 py-2 rounded-full font-label-caps text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                    selectedTag === cat
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-white/60 hover:bg-white text-on-surface-variant border border-outline-variant/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 2. MARQUEE BANNER ━━━ */}
        <section className="w-full bg-emerald-950/5 backdrop-blur-sm mb-12">
          <MarqueeTicker items={blogMarquee} />
        </section>

        {/* ━━━ 3. MAGAZINE EDITORIAL COVER (Lusion Curtain Showcase) ━━━ */}
        {!isLoading && featuredPost && (
          <section className="w-full pb-14 md:pb-20">
            <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
              <ScrollExpandMedia className="rounded-3xl overflow-hidden border border-outline-variant/40 bg-surface-container-lowest/90 backdrop-blur-md shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                  <div className="lg:col-span-7 p-3 md:p-5 flex">
                    <CurtainMediaReveal aspect="aspect-[16/10] md:aspect-auto w-full" className="rounded-2xl min-h-[320px] md:min-h-[440px]">
                      <div className="relative w-full h-full bg-surface-container-high">
                        {resolveImageUrl(featuredPost.thumbnailUrl) ? (
                          <Image
                            src={resolveImageUrl(featuredPost.thumbnailUrl)!}
                            alt={featuredPost.title}
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 750px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-container/10">
                            <span className="material-symbols-outlined text-6xl text-primary/30" style={{ fontVariationSettings: "'FILL' 1" }}>
                              local_florist
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-primary/90 text-white font-label-caps text-xs uppercase tracking-wider backdrop-blur-sm font-semibold shadow-md">
                          Tiêu Điểm Số Này
                        </span>
                      </div>
                    </CurtainMediaReveal>
                  </div>
                  <div className="lg:col-span-5 p-6 md:p-12 lg:pl-4 flex flex-col justify-between">
                    <Reveal>
                      <div className="flex items-center gap-2 text-xs font-label-caps text-tertiary uppercase tracking-wider font-semibold">
                        <span className="material-symbols-outlined text-sm text-primary">verified</span>
                        Chuyên khảo Dược tính
                      </div>
                      <h2 className="font-headline-md text-2xl md:text-3xl text-primary font-bold mt-4 leading-snug">
                        {featuredPost.title}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-4 line-clamp-4 leading-relaxed">
                        {stripHtml(featuredPost.content) || 'Khám phá kiến thức chuyên sâu về công dụng trị liệu và cách ứng dụng tinh hoa dược liệu vào đời sống hàng ngày.'}
                      </p>
                    </Reveal>

                    <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          LH
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{featuredPost.author?.fullName ?? 'Dược sĩ LocHerbal'}</p>
                          <p className="text-[11px] text-tertiary">Ban Biên Tập Chuyên Môn</p>
                        </div>
                      </div>
                      {featuredPost.publishedAt && (
                        <span className="font-label-caps tracking-wider uppercase">
                          {new Date(featuredPost.publishedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollExpandMedia>
            </div>
          </section>
        )}

        {/* ━━━ 4. ASYMMETRICAL SPOTLIGHT & EDITORIAL SECTION ━━━ */}
        {!isLoading && secondaryPost && (
          <section className="w-full pb-14 md:pb-20">
            <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Secondary Featured Post */}
                <div className="lg:col-span-7">
                  <TiltCard>
                    <div className="p-6 md:p-8 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 shadow-botanical">
                      <CurtainMediaReveal aspect="aspect-[16/9]" className="rounded-2xl mb-6">
                        <div className="relative w-full h-full bg-surface-container-high">
                          {resolveImageUrl(secondaryPost.thumbnailUrl) ? (
                            <Image
                              src={resolveImageUrl(secondaryPost.thumbnailUrl)!}
                              alt={secondaryPost.title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 600px"
                              className="object-cover object-center"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="material-symbols-outlined text-4xl text-primary/30">eco</span>
                            </div>
                          )}
                        </div>
                      </CurtainMediaReveal>
                      <span className="font-label-caps text-xs text-secondary uppercase tracking-wider font-semibold">Bài viết chọn lọc</span>
                      <h3 className="font-headline-md text-xl md:text-2xl text-primary font-bold mt-2">
                        {secondaryPost.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-3 line-clamp-2">
                        {stripHtml(secondaryPost.content)}
                      </p>
                    </div>
                  </TiltCard>
                </div>

                {/* Editorial Zen Quote Box */}
                <div className="lg:col-span-5">
                  <div className="relative p-8 md:p-12 rounded-3xl bg-primary text-on-primary shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
                    <span className="material-symbols-outlined text-5xl text-emerald-300/40 mb-4 font-serif">format_quote</span>
                    <blockquote className="font-headline-md text-xl md:text-2xl text-white font-medium italic leading-relaxed">
                      &ldquo;Nam dược trị Nam nhân — Cây thuốc trên chính mảnh đất quê hương là bài thuốc diệu kỳ nhất cho thể trạng con người nơi đó.&rdquo;
                    </blockquote>
                    <p className="font-label-caps text-xs text-emerald-300 uppercase tracking-widest mt-6">
                      — Đại Danh Y Tuệ Tĩnh (Thánh Thuốc Nam)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ━━━ 5. REGULAR ARTICLES GRID ━━━ */}
        <section className="w-full pb-16 md:pb-24">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-3xl overflow-hidden border border-outline-variant/40 animate-pulse bg-white/40">
                    <div className="aspect-[16/9] bg-surface-container-high" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-surface-container-high rounded w-4/5" />
                      <div className="h-3 bg-surface-container-high rounded w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (regularPosts.length > 0 || blogPosts.length > 0) ? (
              <>
                <div className="mb-8">
                  <MaskedTextReveal
                    className="font-headline-md text-2xl text-primary font-bold"
                    lines={['Khám Phá Tất Cả Bài Viết']}
                  />
                </div>
                <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(regularPosts.length > 0 ? regularPosts : blogPosts).map((post) => {
                    const img = resolveImageUrl(post.thumbnailUrl);
                    const snippet = stripHtml(post.content);
                    return (
                      <article
                        key={post.id}
                        className="lusion-card group bg-surface-container-lowest/85 backdrop-blur-sm rounded-3xl overflow-hidden
                                   border border-outline-variant/40 shadow-botanical flex flex-col h-full"
                      >
                        <CurtainMediaReveal aspect="aspect-[16/10]" className="rounded-t-3xl">
                          <div className="relative w-full h-full bg-surface-container-high">
                            {img ? (
                              <Image
                                src={img}
                                alt={post.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary-container/10">
                                <span className="material-symbols-outlined text-5xl text-primary/30" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  local_florist
                                </span>
                              </div>
                            )}
                          </div>
                        </CurtainMediaReveal>
                        <div className="p-7 flex flex-col flex-1 justify-between">
                          <div>
                            <span className="font-label-caps text-[11px] text-tertiary uppercase tracking-wider font-semibold">
                              Cẩm nang
                            </span>
                            <h2 className="font-headline-md text-lg md:text-xl font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors mt-1.5">
                              {post.title}
                            </h2>
                            {snippet && (
                              <p className="font-body-sm text-sm text-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
                                {snippet}
                              </p>
                            )}
                          </div>
                          <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                            <span>{post.author?.fullName ?? 'LocHerbal'}</span>
                            {post.publishedAt && (
                              <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                            )}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </StaggerReveal>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-primary-container/40 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                  article
                </span>
                <h2 className="font-headline-md text-headline-md text-primary">Chưa có bài viết nào</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Các bài viết sẽ sớm được cập nhật. Hãy quay lại sau nhé!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ━━━ 6. APOTHECARY NEWSLETTER CLUB ━━━ */}
        <section className="w-full pb-12">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="p-8 md:p-14 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/50 shadow-botanical text-center relative overflow-hidden">
              <div className="max-w-2xl mx-auto relative z-10">
                <span className="w-12 h-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                </span>
                <MaskedTextReveal
                  className="font-headline-lg text-2xl md:text-3xl text-primary font-bold"
                  lines={['Nhận Cẩm Nang Dưỡng Sinh Định Kỳ']}
                />
                <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
                  Mỗi tuần 1 bức thư thảo dược: Bí quyết thanh lọc cơ thể, các bài thuốc dân gian lành tính và ưu đãi dành riêng cho thành viên LocHerbal Club.
                </p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex flex-col sm:flex-row gap-3 mt-8 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="flex-1 px-5 py-3.5 rounded-full border border-outline-variant/60 bg-white/70 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary text-sm shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-label-caps text-xs uppercase tracking-wider font-semibold transition-all shadow-md shrink-0"
                  >
                    Đăng ký ngay
                  </button>
                </form>
                <p className="text-[11px] text-tertiary mt-3">Cam kết bảo mật 100% • Hủy đăng ký bất kỳ lúc nào.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
