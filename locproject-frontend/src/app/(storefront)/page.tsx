'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import ConsultationForm from '@/components/storefront/home/ConsultationForm';
import { apiClient } from '@/lib/api/client';
import { usePublicBlogPosts, usePublicPageBlocks } from '@/lib/hooks/useMarketing';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { Product } from '@/types/api.types';
import { getVariantPricing } from '@/lib/utils/discount';
import {
  FadeUp,
  FadeLeft,
  FadeRight,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  ParallaxImage,
  CountUp,
  TextReveal,
} from '@/components/ui/ScrollAnimations';

type LoadState = 'loading' | 'success' | 'error';

async function fetchProducts(retries = 2, timeoutMs = 30000): Promise<Product[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await apiClient.get('/products', { params: { limit: 12 }, timeout: timeoutMs });
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

// 4 thể trạng sức khỏe chủ đạo (Concerns / Rituals)
const HEALTH_CONCERNS = [
  {
    id: 'an-than',
    name: 'An Thần & Giấc Ngủ',
    tagline: 'Vỗ về giấc ngủ sâu từ tâm sen, toan táo nhân & lạc tiên Tây Bắc',
    icon: 'bedtime',
    categoryFilter: 'an-than-ngu-ngon',
    color: '#344E41',
  },
  {
    id: 'tim-mach',
    name: 'Khí Huyết & Tim Mạch',
    tagline: 'Điều hòa tuần hoàn, bảo vệ thành mạch với đan sâm & đương quy',
    icon: 'monitor_heart',
    categoryFilter: 'tim-mach',
    color: '#582F0E',
  },
  {
    id: 'thanh-nhiet',
    name: 'Thanh Nhiệt & Dưỡng Can',
    tagline: 'Làm mát gan, đào thải độc tố sinh học bằng cà gai leo & atiso',
    icon: 'eco',
    categoryFilter: 'tieu-hoa',
    color: '#2D6A4F',
  },
  {
    id: 'xuong-khop',
    name: 'Cơ Khớp & Sinh Lực',
    tagline: 'Tăng cường dịch khớp, dẻo dai gân cốt từ dây đau xương & ngũ gia bì',
    icon: 'accessibility_new',
    categoryFilter: 'xuong-khop',
    color: '#4A5759',
  },
];

const BOTANICAL_PILLARS = [
  {
    tag: 'Nguồn Thổ Nhưỡng',
    title: 'Độ cao 1.600m tại Mộc Châu & Sa Pa',
    desc: 'Thảo mộc hấp thụ sương núi và vi chất giàu có trong đất mùn cổ nguyên sinh, tích lũy dược tính cao gấp 3 lần cây trồng đồng bằng.',
    stat: '1.600m',
    statLabel: 'Độ cao vùng nguyên liệu',
    img: '/images/decor/home-bg.webp',
  },
  {
    tag: 'Phương Pháp Thu Hái',
    title: 'Hái thủ công trong sương sớm',
    desc: 'Chỉ thu hoạch từ 5h00 đến 8h00 sáng khi sương mai đọng trên búp lá nhằm bảo toàn trọn vẹn tinh dầu và saponin quý giá.',
    stat: '05:00 - 08:00',
    statLabel: 'Khung giờ vàng thu hái',
    img: '/images/decor/tu-van.webp',
  },
  {
    tag: 'Công Nghệ Chiết Xuất',
    title: 'Sấy lạnh phân đoạn giữ 98% hoạt tính',
    desc: 'Ứng dụng nhiệt độ âm sâu loại bỏ ẩm mà không phá vỡ cấu trúc vi chất hữu cơ, mang lại thành phẩm dược liệu thuần khiết.',
    stat: '98.2%',
    statLabel: 'Bảo tồn hoạt chất sinh học',
    img: '/images/decor/space.webp',
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [activeConcern, setActiveConcern] = useState(HEALTH_CONCERNS[0].id);
  const { data: blogPosts = [] } = usePublicBlogPosts();
  const { data: adminHomeBlocks = [] } = usePublicPageBlocks('home');

  // Trích xuất hero block & showcase block từ Admin nếu có cấu hình
  const heroBlock = adminHomeBlocks.find((b) => b.type === 'hero');
  const customHeroTitle = (heroBlock?.content?.title as string) || 'Dược Tính Từ Đất Mẹ Khoa Học Chuẩn Hóa';
  const customHeroSubtitle = (heroBlock?.content?.subtitle as string) || 'LocHerbal gìn giữ tinh hoa y học bản địa ngàn năm của người Việt, chuẩn hóa qua kiểm nghiệm sắc ký nghiêm ngặt nhằm mang lại liệu trình chăm sóc sức khỏe thuần khiết và an tâm tuyệt đối.';
  const customHeroImage = heroBlock?.content?.backgroundImageUrl
    ? (resolveImageUrl(heroBlock.content.backgroundImageUrl as string) || '/images/decor/home-bg.webp')
    : '/images/decor/home-bg.webp';

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

  // Lọc sản phẩm theo Concern đang chọn hoặc fallback danh sách
  const currentConcernObj = HEALTH_CONCERNS.find((c) => c.id === activeConcern) || HEALTH_CONCERNS[0];
  const displayedProducts = products.length > 0 ? products.slice(0, 6) : [];

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0 bg-transparent min-h-screen">
        {/* ══════════════════════════════════════════════════════════════════
            1. HERO SECTION — EDITORIAL APOTHECARY (Aesop + Lusion Style)
           ══════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Cột trái: Văn bản chuẩn mực Apothecary */}
              <div className="lg:col-span-7 z-10">
                <FadeUp>
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30
                                   text-secondary font-label-caps text-xs uppercase tracking-[0.16em] bg-white/60 backdrop-blur-md shadow-sm">
                    <span className="material-symbols-outlined text-base">spa</span>
                    LocHerbal Botanical Apothecary
                  </span>
                </FadeUp>

                <FadeUp delay={0.1}>
                  <h1 className="text-display-lg md:text-headline-xl lg:text-[56px] text-primary font-display font-bold mt-6 leading-[1.08] tracking-[-0.035em]">
                    <TextReveal text={customHeroTitle} />
                  </h1>
                </FadeUp>

                <FadeUp delay={0.2}>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-6 max-w-xl leading-relaxed">
                    {customHeroSubtitle}
                  </p>
                </FadeUp>

                <FadeUp delay={0.3}>
                  <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <Link
                      href="/products"
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                                 bg-primary text-white font-label-caps text-xs uppercase tracking-[0.14em]
                                 hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-md font-semibold text-center"
                    >
                      Khám phá danh mục <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                    <Link
                      href="/tu-van"
                      className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full
                                 bg-white/80 border border-outline-variant/60 text-primary font-label-caps text-xs uppercase tracking-[0.14em]
                                 hover:bg-white hover:border-primary/50 transition-all duration-300 font-semibold shadow-sm text-center"
                    >
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                      Đặt lịch cùng Dược sĩ
                    </Link>
                  </div>
                </FadeUp>

                {/* Micro Trust badges */}
                <FadeUp delay={0.4}>
                  <div className="mt-12 pt-6 border-t border-outline-variant/30 flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-label-caps text-on-surface-variant uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">verified</span>
                      Chuẩn GMP & ISO
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">science</span>
                      Kiểm nghiệm HPLC
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">nature_people</span>
                      Dược sĩ đồng hành 1-1
                    </span>
                  </div>
                </FadeUp>
              </div>

              {/* Cột phải: Khung ảnh nghệ thuật Botanical Parallax */}
              <div className="lg:col-span-5 relative">
                <FadeRight delay={0.2}>
                  <div className="relative mx-auto max-w-[460px] lg:max-w-none aspect-[4/5] rounded-[36px] overflow-hidden shadow-2xl border border-white/60">
                    <ParallaxImage className="w-full h-full relative" speed={0.25}>
                      <Image
                        src={customHeroImage}
                        alt="Không gian dược liệu LocHerbal"
                        fill
                        priority
                        className="object-cover object-center scale-105"
                      />
                    </ParallaxImage>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

                    {/* Thẻ nổi trích dẫn dược thư */}
                    <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/85 backdrop-blur-md border border-white/40 shadow-botanical">
                      <span className="font-label-caps text-[11px] text-secondary font-bold uppercase tracking-widest">
                        Triết lý Apothecary
                      </span>
                      <p className="font-headline-md text-sm text-primary font-bold mt-1">
                        &ldquo;Nam dược trị Nam nhân &mdash; Thuốc Nam dưỡng người Việt&rdquo;
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Đại Danh Y Thiền Sư Tuệ Tĩnh (Thánh Thuốc Nam)
                      </p>
                    </div>
                  </div>
                </FadeRight>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            2. INTERACTIVE CONCERNS — LỌC THẢO DƯỢC THEO THỂ TRẠNG
           ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 md:py-24 bg-surface-container-lowest/60 border-y border-outline-variant/30 relative">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="font-label-caps text-xs text-secondary uppercase tracking-[0.18em] font-bold">
                Cá Nhân Hóa Trải Nghiệm
              </span>
              <h2 className="font-headline-lg text-2xl md:text-4xl text-primary font-bold mt-3">
                Lắng Nghe Nhu Cầu Cơ Thể Bạn
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
                Mỗi thể trạng cần một sự nâng niu riêng biệt. Chọn vấn đề bạn đang quan tâm để khám phá giải pháp thảo dược phù hợp nhất.
              </p>
            </div>

            {/* Concern Tabs Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-12">
              {HEALTH_CONCERNS.map((c) => {
                const isActive = c.id === activeConcern;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConcern(c.id)}
                    className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-label-caps text-xs uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                        : 'bg-white/80 text-on-surface-variant hover:bg-white hover:text-primary border border-outline-variant/40 shadow-sm'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{c.icon}</span>
                    <span className="font-semibold">{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Concern Info Banner */}
            <FadeUp key={activeConcern} className="mb-10">
              <div className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-outline-variant/40 shadow-botanical flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">{currentConcernObj.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-xl text-primary font-bold">{currentConcernObj.name}</h3>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">{currentConcernObj.tagline}</p>
                  </div>
                </div>

                <Link
                  href={`/products?categoryId=${currentConcernObj.categoryFilter}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-label-caps uppercase tracking-wider font-semibold transition-all shrink-0"
                >
                  Xem tất cả dòng {currentConcernObj.name}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </FadeUp>

            {/* Products Grid */}
            {loadState === 'loading' ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-3xl bg-white/50 border border-outline-variant/40 h-80 animate-pulse" />
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedProducts.map((p) => {
                  const defaultVariant = p.variants?.[0];
                  const pricing = getVariantPricing(defaultVariant);
                  const img = resolveImageUrl(p.thumbnailUrl);
                  return (
                    <StaggerItem key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        className="group flex flex-col h-full bg-surface-container-lowest/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-outline-variant/40 shadow-botanical hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                      >
                        <div className="relative aspect-square bg-[#F4F6F4] overflow-hidden">
                          {img ? (
                            <Image
                              src={img}
                              alt={p.name}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30">
                              <span className="material-symbols-outlined text-5xl">local_florist</span>
                            </div>
                          )}
                          {pricing.isDiscountActive && pricing.discountPercent && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-tertiary text-white text-[11px] font-bold shadow-sm">
                              -{pricing.discountPercent}%
                            </span>
                          )}
                        </div>

                        <div className="p-5 flex flex-col flex-grow justify-between">
                          <div>
                            <span className="font-label-caps text-[10px] text-tertiary uppercase tracking-wider font-semibold">
                              Dược liệu tuyển chọn
                            </span>
                            <h4 className="font-headline-md text-sm md:text-base font-bold text-on-surface line-clamp-2 mt-1 group-hover:text-primary transition-colors">
                              {p.name}
                            </h4>
                          </div>

                          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                            <div>
                              {pricing.compareAtPrice && pricing.compareAtPrice > pricing.price && (
                                <span className="block text-xs text-on-surface-variant line-through">
                                  {formatPrice(pricing.compareAtPrice)}
                                </span>
                              )}
                              <span className="font-headline-md text-base text-primary font-bold">
                                {formatPrice(pricing.price)}
                              </span>
                            </div>
                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-sm">shopping_bag</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            ) : (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-primary/30">eco</span>
                <p className="text-on-surface-variant mt-2 font-body-md">Đang cập nhật danh mục thảo dược...</p>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. BOTANICAL HERITAGE & SCIENCE — BENTO GRID TIÊU CHUẨN
           ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 md:py-24 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="font-label-caps text-xs text-secondary uppercase tracking-[0.18em] font-bold">
                  Quy Trình Kiểm Soát Khép Kín
                </span>
                <h2 className="font-headline-lg text-2xl md:text-4xl text-primary font-bold mt-2">
                  Minh Bạch Từ Vườn Thuốc Đến Lọ Bào Chế
                </h2>
              </div>
              <Link
                href="/ve-chung-toi"
                className="mt-4 md:mt-0 text-xs font-label-caps uppercase tracking-wider text-primary font-bold hover:underline flex items-center gap-1.5"
              >
                Xem chi tiết hành trình 4 trạm
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {BOTANICAL_PILLARS.map((col, idx) => (
                <ScaleIn key={col.title} delay={idx * 0.15}>
                  <div className="h-full rounded-3xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/40 shadow-botanical overflow-hidden flex flex-col justify-between">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={col.img}
                        alt={col.title}
                        fill
                        className="object-cover object-center hover:scale-105 transition-transform duration-700"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-primary font-label-caps text-[11px] font-bold uppercase tracking-wider">
                        {col.tag}
                      </span>
                    </div>

                    <div className="p-7 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-headline-md text-lg text-primary font-bold leading-snug">
                          {col.title}
                        </h3>
                        <p className="font-body-sm text-sm text-on-surface-variant mt-3 leading-relaxed">
                          {col.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                        <span className="font-headline-lg text-2xl text-primary font-bold font-display">
                          {col.stat}
                        </span>
                        <span className="text-[11px] font-label-caps uppercase text-secondary font-semibold text-right">
                          {col.statLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. THE APOTHECARY NOTE — LỜI NHẮN TỪ DƯỢC SĨ TRƯỞNG
           ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 bg-surface-container-lowest/70 border-t border-outline-variant/30 relative overflow-hidden">
          <div className="mx-auto max-w-[1100px] px-margin-mobile md:px-8">
            <div className="p-8 md:p-12 rounded-[32px] bg-primary text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-8">
                  <span className="font-label-caps text-xs text-emerald-300 uppercase tracking-widest font-semibold">
                    The Apothecary Note &bull; Góc Chuyên Gia
                  </span>
                  <h3 className="font-display font-bold text-2xl md:text-3xl text-white mt-3 leading-snug">
                    &ldquo;Thảo mộc không chỉ là phương thuốc, mà là nghệ thuật nuôi dưỡng từng tế bào mỗi ngày.&rdquo;
                  </h3>
                  <p className="font-body-md text-white/80 mt-4 leading-relaxed max-w-2xl">
                    Tại LocHerbal, chúng tôi tin rằng sức khỏe viên mãn bắt nguồn từ sự hòa hợp giữa thể chất và tinh thần.
                    Đội ngũ dược sĩ lâm sàng của chúng tôi luôn sẵn sàng lắng nghe mọi băn khoăn về thể trạng để cùng bạn thiết kế liệu trình lành tính nhất.
                  </p>
                  <p className="font-label-caps text-xs text-emerald-300 uppercase tracking-wider mt-6 font-semibold">
                    DS. Nguyễn Minh Trí &mdash; Trưởng Ban Nghiên Cứu & Phát Triển Dược Liệu
                  </p>
                </div>

                <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center">
                  <Link
                    href="/tu-van"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white text-primary font-label-caps text-xs uppercase tracking-wider font-bold hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg text-center"
                  >
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    Đặt Lịch Bắt Mạch Thể Trạng
                  </Link>
                  <span className="text-[11px] text-white/60 mt-3 text-center md:text-right">
                    Tư vấn miễn phí 1-1 &bull; 15 phút phản hồi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. JOURNAL & EDITORIAL — GÓC TRI THỨC DƯỠNG SINH
           ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full py-16 md:py-24 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="font-label-caps text-xs text-secondary uppercase tracking-[0.18em] font-bold">
                  Tri Thức Y Học Cổ Truyền
                </span>
                <h2 className="font-headline-lg text-2xl md:text-4xl text-primary font-bold mt-2">
                  Cẩm Nang Dưỡng Sinh LocHerbal
                </h2>
              </div>
              <Link
                href="/blog"
                className="mt-4 md:mt-0 text-xs font-label-caps uppercase tracking-wider text-primary font-bold hover:underline flex items-center gap-1.5"
              >
                Đọc toàn bộ bài viết
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            {blogPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogPosts.slice(0, 3).map((post) => {
                  const img = resolveImageUrl(post.thumbnailUrl);
                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col h-full bg-surface-container-lowest/85 backdrop-blur-sm rounded-3xl overflow-hidden border border-outline-variant/40 shadow-botanical hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[16/10] bg-surface-container-high overflow-hidden">
                        {img ? (
                          <Image
                            src={img}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary/30">
                            <span className="material-symbols-outlined text-5xl">auto_stories</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-grow justify-between">
                        <div>
                          <span className="font-label-caps text-[11px] text-tertiary uppercase tracking-wider font-semibold">
                            Cẩm nang
                          </span>
                          <h3 className="font-headline-md text-base md:text-lg font-bold text-on-surface line-clamp-2 mt-1 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-label-caps">
                          <span>{post.author?.fullName ?? 'LocHerbal'}</span>
                          <span className="text-primary font-bold flex items-center gap-1">
                            Đọc bài <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-primary/30">auto_stories</span>
                <p className="text-on-surface-variant mt-2 font-body-md">Các bài viết dưỡng sinh đang được biên soạn...</p>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. FORM TƯ VẤN TRỰC TIẾP
           ══════════════════════════════════════════════════════════════════ */}
        <section className="w-full pb-16 bg-transparent">
          <div className="mx-auto max-w-[1000px] px-margin-mobile md:px-6">
            <ScaleIn delay={0.1}>
              <div className="rounded-[32px] bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/50 shadow-botanical overflow-hidden p-4 sm:p-8">
                <div className="text-center mb-6">
                  <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold">
                    Tư Vấn Nhanh 1-1
                  </span>
                  <h2 className="font-headline-lg text-2xl md:text-3xl text-primary font-bold mt-2">
                    Để Dược Sĩ Đồng Hành Cùng Thể Trạng Bạn
                  </h2>
                </div>
                <ConsultationForm showHeader={false} />
              </div>
            </ScaleIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
