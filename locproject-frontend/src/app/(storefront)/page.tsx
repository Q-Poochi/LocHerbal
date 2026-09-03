'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../../components/storefront/layout/Navbar';
import Footer from '../../components/storefront/layout/Footer';
import ConsultationForm from '../../components/storefront/home/ConsultationForm';
import { apiClient } from '../../lib/api/client';
import { usePublicBlogPosts } from '../../lib/hooks/useMarketing';
import { resolveImageUrl } from '../../lib/utils/imageUrl';
import type { Product } from '@/types/api.types';

type LoadState = 'loading' | 'success' | 'error';

async function fetchProducts(retries = 2, timeoutMs = 30000): Promise<Product[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await apiClient.get('/products', { params: { limit: 8 }, timeout: timeoutMs });
      return res.data?.data ?? res.data ?? [];
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + '₫';
}

const REMEDIES = [
  { name: 'Tim Mạch', icon: 'monitor_heart', href: '/products?categoryId=tim-mach', desc: 'Hỗ trợ tuần hoàn & huyết áp' },
  { name: 'Xương Khớp', icon: 'accessibility_new', href: '/products?categoryId=xuong-khop', desc: 'Cơ khớp linh hoạt, dẻo dai' },
  { name: 'Tiêu Hóa', icon: 'local_florist', href: '/products?categoryId=tieu-hoa', desc: 'Dạ dày & hệ tiêu hóa khỏe mạnh' },
  { name: 'An Thần', icon: 'bedtime', href: '/products?categoryId=an-than-ngu-ngon', desc: 'Ngủ ngon & thư giãn tinh thần' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const { data: blogPosts = [] } = usePublicBlogPosts();

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setProducts(await fetchProducts());
      setLoadState('success');
    } catch {
      setProducts([]);
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ảnh thật cho khối hero — ưu tiên ảnh đầu tiên của sản phẩm mới nhất,
  // fallback về thumbnailUrl. resolveImageUrl trả null nếu rỗng → render SVG.
  const firstProduct = products[0] as unknown as
    | { images?: { url?: string }[]; thumbnailUrl?: string }
    | undefined;
  const heroRaw = firstProduct?.images?.[0]?.url ?? firstProduct?.thumbnailUrl;
  const heroSrc = resolveImageUrl(heroRaw);

  /* ── Carousel "Sản phẩm nổi bật": mỗi lần chỉ hiện 1 nhóm sản phẩm,
     có nút chuyển trước/sau + dots, tự động chạy 5 giây/lần (loop).
     Tạm dừng auto-play khi người dùng hover vào vùng carousel. ── */
  const [pageIdx, setPageIdx] = useState(0);
  const [perView, setPerView] = useState(4);   // 4 SP/lượt trên desktop, 2 trên mobile
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setPerView(mq.matches ? 4 : 2);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const pageCount = Math.max(1, Math.ceil(products.length / perView));

  // perView đổi (resize) → giữ pageIdx trong phạm vi hợp lệ
  useEffect(() => {
    if (pageIdx >= pageCount) setPageIdx(0);
  }, [pageCount, pageIdx]);

  // Auto-play: chạy tiếp mỗi 5s, loop về nhóm đầu
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused || pageCount <= 1) {
      if (autoRef.current) clearInterval(autoRef.current);
      return;
    }
    autoRef.current = setInterval(() => setPageIdx((i) => (i + 1) % pageCount), 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [paused, pageCount]);

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden"> {/* trong suốt → lộ nền lá fixed (BotanicalBackground) */}
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] py-16 md:py-24
                          grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tertiary/40
                               text-tertiary font-label-caps text-label-caps uppercase tracking-[0.1em] bg-white/40">
                <span className="material-symbols-outlined text-base">eco</span>
                Modern Apothecary
              </span>
              <h1 className="text-display-lg md:text-headline-xl text-primary mt-6 leading-[1.1] tracking-[-0.02em] font-display font-bold">
                Tinh hoa thảo mộc,
                <br />
                <span className="text-secondary">chuẩn khoa học hiện đại</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-6 max-w-md mx-auto lg:mx-0">
                LocHerbal mang đến những giải pháp chăm sóc sức khỏe tự nhiên, được
                nghiên cứu và bào chế theo tiêu chuẩn apothecary cao cấp — xuất phát
                từ thiên nhiên, kiểm chứng bằng khoa học.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-9 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                             bg-primary-container text-on-primary font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:bg-primary hover:shadow-botanical-hover
                             transition-all duration-300 shadow-botanical"
                >
                  Khám phá sản phẩm
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href="/tu-van"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                             border border-secondary/50 text-on-surface font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:border-secondary hover:text-secondary
                             transition-all duration-300"
                >
                  Đặt lịch tư vấn
                </Link>
              </div>
            </div>


            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-low
                              border border-outline-variant/40 shadow-botanical">
                {/* Nền lá thật (Home.jpg) thay cho gradient xanh đậm */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(/images/decor/home-bg.webp)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                {heroSrc ? (
                  <Image src={heroSrc} alt="Sản phẩm thảo dược LocHerbal" fill
                         sizes="(max-width: 1024px) 100vw, 50vw"
                         className="object-cover" priority />
                ) : (
                  /* Placeholder botanical trung tính khi chưa tải được ảnh thật —
                     KHÔNG dùng icon-font cỡ lớn (tránh lộ text thô nếu font fail)
                     và không lộ tên file */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 120 90" className="w-48 text-primary/30" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M60 78V34" />
                      <path d="M60 46c-14 0-22-8-24-20 12 0 21 7 24 20z" />
                      <path d="M60 46c14 0 22-8 24-20-12 0-21 7-24 20z" />
                      <path d="M60 62c-11 0-17-6-19-15 9 0 16 5 19 15z" />
                      <path d="M60 62c11 0 17-6 19-15-9 0-16 5-19 15z" />
                      <circle cx="60" cy="26" r="3.5" />
                    </svg>
                  </div>
                )}
                <div className="glass-card absolute bottom-5 left-5 rounded-xl px-5 py-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <div>
                    <p className="font-headline-md text-headline-md text-on-surface leading-none">100%</p>
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.1em] mt-1">
                      Thành phần tự nhiên
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REMEDIES / CHUYÊN KHOA ─────────────────────────────── */}
        <section className="w-full py-16 md:py-20 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Chuyên khoa</span>
                <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-2">Remedies theo chuyên khoa</h2>
              </div>
              <Link href="/products" className="inline-flex items-center gap-1 text-secondary hover:text-primary
                                                   font-label-caps text-label-caps uppercase tracking-[0.1em] transition-colors">
                Xem tất cả <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {REMEDIES.map((r) => (
                <Link
                  key={r.name}
                  href={r.href}
                  className="group bg-surface-container-lowest rounded-lg p-7 border border-outline-variant/50
                             hover:border-secondary/40 hover:shadow-botanical-hover
                             transition-all duration-300 flex flex-col gap-4"
                >
                  <span className="w-12 h-12 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center
                                   group-hover:bg-primary-container group-hover:text-on-primary transition-colors duration-300">
                    <span className="material-symbols-outlined text-2xl">{r.icon}</span>
                  </span>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{r.name}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{r.desc}</p>
                  </div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider group-hover:text-primary transition-colors">
                    Khám phá
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {/* ── FEATURED PRODUCTS ──────────────────────────────────── */}
        <section className="w-full py-16 md:py-20 bg-gradient-to-b from-[#f2f7f3] via-[#e4efe6] to-[#f2f7f3]">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center mb-12">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Bộ sưu tập</span>
              <h2 className="font-serif-classic font-semibold text-headline-lg md:text-headline-xl text-primary mt-2 tracking-tight">
                Sản phẩm nổi bật
              </h2>
            </div>

            {loadState === 'loading' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-surface-container-low animate-pulse h-[320px]" />
                ))}
              </div>
            )}

            {loadState === 'error' && (
              <div className="text-center py-16 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">cloud_off</span>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
                  Không thể tải sản phẩm. Vui lòng thử lại.
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-5 px-6 py-3 rounded-full bg-primary-container text-on-primary
                             font-label-caps text-label-caps uppercase tracking-[0.1em] hover:bg-primary transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {loadState === 'success' && (
              <div
                data-testid="featured-carousel"
                className="relative"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                {/* Nút lùi */}
                <button
                  type="button"
                  data-testid="carousel-prev"
                  aria-label="Nhóm sản phẩm trước"
                  onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                  disabled={pageIdx === 0}
                  className="absolute -left-4 md:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                             bg-surface-container-lowest border border-outline-variant shadow-botanical
                             flex items-center justify-center text-primary
                             hover:bg-primary hover:text-on-primary transition-all duration-200
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-container-lowest disabled:hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>

                {/* Track — mỗi trang trượt ngang 100% width */}
                <div className="overflow-hidden -mx-3">
                  <div
                    data-testid="carousel-track"
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${pageIdx * 100}%)`, willChange: 'transform' }}
                  >
                    {products.map((p) => {
                      const price = p.variants?.[0]?.price ?? 0;
                      const img = resolveImageUrl(p.thumbnailUrl);
                      return (
                        <div key={p.id} className="flex-shrink-0 w-1/2 md:w-1/4 px-3">
                          <Link
                            href={`/products/${p.slug}`}
                            className="group h-full bg-surface-container-lowest rounded-lg border border-outline-variant/50
                                       shadow-botanical hover:shadow-botanical-hover transition-shadow duration-300
                                       flex flex-col overflow-hidden"
                          >
                            <div
                              className="relative aspect-square overflow-hidden bg-surface-container"
                            >
                              {img ? (
                                <Image
                                  src={img}
                                  alt={p.name}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 25vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-5xl text-primary/40" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                                </div>
                              )}
                            </div>
                            {/* Khối chữ — chiều cao cố định theo dòng để mọi card đồng nhất:
                                1 dòng category (truncate) + đúng 2 dòng tên (min-h) + giá luôn đáy card */}
                            <div className="flex flex-col flex-grow p-5">
                              <span className="font-label-caps text-label-caps text-tertiary uppercase tracking-wider truncate">
                                {p.category?.name ?? 'Thảo dược'}
                              </span>
                              <h3 className="font-serif-classic font-light text-lg md:text-xl leading-snug text-on-surface
                                             line-clamp-2 min-h-[3.1rem] md:min-h-[3.45rem] mt-1">
                                {p.name}
                              </h3>
                              <div className="mt-auto pt-3 flex items-center justify-between">
                                <span className="font-body-lg text-body-lg font-semibold text-primary-container">{formatPrice(price)}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nút tới */}
                <button
                  type="button"
                  data-testid="carousel-next"
                  aria-label="Nhóm sản phẩm tiếp theo"
                  onClick={() => setPageIdx((i) => Math.min(pageCount - 1, i + 1))}
                  disabled={pageIdx >= pageCount - 1}
                  className="absolute -right-4 md:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                             bg-surface-container-lowest border border-outline-variant shadow-botanical
                             flex items-center justify-center text-primary
                             hover:bg-primary hover:text-on-primary transition-all duration-200
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-container-lowest disabled:hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>

                {/* Dots — bấm nhảy tới nhóm bất kỳ */}
                {pageCount > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pageCount }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        data-testid={`carousel-dot-${i}`}
                        aria-label={`Đến nhóm sản phẩm nổi bật ${i + 1}`}
                        onClick={() => setPageIdx(i)}
                        className={`transition-all duration-300 rounded-full h-2
                          ${i === pageIdx ? 'w-6 bg-primary' : 'w-2 bg-outline-variant hover:bg-secondary'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>


        {/* ── VALUE PROPS ────────────────────────────────────────── */}
        <section className="relative w-full py-16 bg-primary text-on-primary overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/decor/home-bg.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.14,
            }}
          />
          <div className="relative mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              {[
                { icon: 'spa', title: 'Thiên nhiên thuần khiết', desc: 'Nguyên liệu sạch, canh tác bền vững từ các vùng trồng dược liệu uy tín.' },
                { icon: 'science', title: 'Chuẩn khoa học', desc: 'Được nghiên cứu, kiểm nghiệm và bào chế theo quy trình apothecary khắt khe.' },
                { icon: 'support_agent', title: 'Tư vấn chuyên môn', desc: 'Đội ngũ dược sĩ đồng hành, đặt lịch tư vấn trực tiếp miễn phí.' },
              ].map((v) => (
                <div key={v.title} className="flex flex-col items-center gap-4">
                  <span className="w-14 h-14 rounded-full bg-on-primary/10 border border-on-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                  </span>
                  <h3 className="font-headline-md text-headline-md">{v.title}</h3>
                  <p className="font-body-md text-body-md text-on-primary/80 max-w-xs">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROMO → /uu-dai ─────────────────────────────────────── */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-[#eef5ef] via-[#dfece1] to-[#eef5ef]">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="rounded-lg overflow-hidden bg-surface-container-lowest border border-outline-variant/50 shadow-botanical
                            grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="p-8 md:p-12">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Ưu đãi đặc biệt</span>
                <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-3 leading-tight">
                  Chăm sóc sức khỏe
                  <br /> trọn bộ, giá ưu đãi
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
                  Mã giảm giá, combo tiết kiệm và ưu đãi thành viên đang chờ bạn.
                </p>
                <Link
                  href="/uu-dai"
                  className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full
                             bg-primary-container text-on-primary font-label-caps text-label-caps uppercase
                             tracking-[0.1em] hover:bg-primary hover:shadow-botanical-hover transition-all duration-300"
                >
                  Xem ưu đãi <span className="material-symbols-outlined text-lg">local_activity</span>
                </Link>
              </div>
              <div
                className="relative h-56 md:h-full flex items-center justify-center"
                style={{
                  backgroundImage: 'url(/images/decor/home-bg.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span className="material-symbols-outlined text-primary/25" style={{ fontSize: '160px', fontVariationSettings: "'FILL' 1" }}>sell</span>
              </div>
            </div>
          </div>
        </section>


        {/* ── BLOG / JOURNAL ─────────────────────────────────────── */}
        {blogPosts.length > 0 && (
          <section id="blog" className="w-full py-16 md:py-20 bg-transparent">
            <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Journal</span>
                  <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-2">Cẩm nang sức khỏe</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogPosts.slice(0, 3).map((post) => {
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
                            <span className="material-symbols-outlined text-5xl text-primary-container/30" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-2 leading-snug">{post.title}</h3>
                        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mt-3">
                          {post.author?.fullName ?? 'LocHerbal'}
                          {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString('vi-VN')}` : ''}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Consultation ───────────────────────────────────────── */}
        <ConsultationForm />
      </main>
      <Footer />
    </>
  );
}

