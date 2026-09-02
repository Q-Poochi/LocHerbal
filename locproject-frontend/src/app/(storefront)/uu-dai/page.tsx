'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
import CountdownTimer from '@/components/storefront/CountdownTimer';
import { apiClient } from '@/lib/api/client';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import type { Product } from '@/types/api.types';

type LoadState = 'loading' | 'success' | 'error';

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await apiClient.get('/products', { params: { limit: 24 } });
    return res.data?.data ?? res.data ?? [];
  } catch {
    return [];
  }
}

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}

function discountedProducts(list: Product[]): Product[] {
  return list.filter((p) => p.variants?.some((v) => v.isDiscountActive && (v.compareAtPrice ?? 0) > v.price));
}

const scrollToDeals = () => {
  document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' });
};

export default function UuDaiPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    const list = await fetchProducts();
    setProducts(list);
    setLoadState('success');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deals = discountedProducts(products);

  const PROMO_CODES = [
    { code: 'LOCHERBAL10', label: 'Giảm 10% đơn từ 500.000đ' },
    { code: 'VIPTRI', label: 'Giảm 15% cho thành viên VIP' },
    { code: 'FREESHIP', label: 'Miễn phí vận chuyển toàn quốc' },
  ];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">
        {/* ═══════ SECTION 1: HERO BANNER ═══════ */}
        <section className="relative w-full h-[480px] overflow-hidden">
          {/* Background ảnh (uu-dai.webp — ảnh thảo mộc mới, khổ dọc;
              object-position 65% để crop vào cụm lá trên đĩa) */}
          <Image
            src="/images/decor/uu-dai.webp"
            alt="Ưu đãi LocHerbal"
            fill
            priority
            quality={90}
            className="object-cover object-[center_65%] scale-105"
          />

          {/* Overlay gradient — tối dần từ trái sang phải (nhẹ hơn vì ảnh gốc đã tối) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d3320]/70 via-[#166b42]/40 to-transparent" />

          {/* Overlay bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fafaf8] via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-[1280px] mx-auto px-6 md:px-10 w-full">
              <div className="max-w-[560px]">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc641] text-[#261a00] rounded-full text-sm font-semibold mb-4">
                  <span className="material-symbols-outlined text-base">local_offer</span>
                  ƯU ĐÃI &amp; KHUYẾN MÃI
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 font-display">
                  Chăm Sóc Sức Khỏe,
                  <br />
                  <span className="text-[#7ee8a2]">Giá Ưu Đãi</span>
                </h1>

                {/* Sub */}
                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                  Nhận ngay ưu đãi hấp dẫn khi mua sản phẩm tại LocHerbal — miễn phí giao hàng,
                  chiết khấu đặc biệt cho thành viên VIP.
                </p>

                {/* CTA */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={scrollToDeals}
                    className="px-6 py-3 bg-[#1a8a54] hover:bg-[#166b42] text-white font-semibold rounded-full
                               transition-all duration-200 hover:shadow-lg hover:shadow-green-900/30"
                  >
                    Xem ưu đãi ngay
                  </button>
                  <Link
                    href="/lien-he"
                    className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-medium rounded-full
                               backdrop-blur-sm border border-white/30 transition-all duration-200"
                  >
                    Điều kiện áp dụng
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown — đếm ngược đến 23:59:59 hôm nay */}
          <div className="absolute bottom-6 right-10 hidden lg:block">
            <CountdownTimer />
          </div>
        </section>

        {/* ═══════ SECTION 2: MEMBERSHIP TIERS ═══════ */}
        <section className="bg-[#fafaf8] py-10">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <p className="text-center text-sm font-medium text-[#5a5a52] uppercase tracking-widest mb-6">
              CẤP ĐỘ THÀNH VIÊN
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  level: 'Thành viên', color: '#c8973a', bg: '#fdf6e3',
                  border: '#f0d99a', discount: '5%', minOrder: '0đ',
                  icon: 'star', perks: ['Tích điểm x1', 'Sinh nhật +10%'],
                },
                {
                  level: 'VIP Silver', color: '#6b7280', bg: '#f4f4f0',
                  border: '#d1d5db', discount: '10%', minOrder: '5.000.000đ',
                  icon: 'diamond', perks: ['Tích điểm x1.5', 'Freeship mọi đơn'],
                },
                {
                  level: 'VIP Gold', color: '#1a8a54', bg: '#f0faf4',
                  border: '#86ddb1', discount: '15%', minOrder: '15.000.000đ',
                  icon: 'workspace_premium',
                  perks: ['Tích điểm x2', 'Tư vấn riêng', 'Quà tặng VIP'],
                },
              ].map((tier) => (
                <div
                  key={tier.level}
                  className="rounded-2xl p-5 border-2 relative overflow-hidden"
                  style={{ background: tier.bg, borderColor: tier.border }}
                >
                  {/* Icon */}
                  <span className="material-symbols-outlined text-3xl mb-3 block" style={{ color: tier.color }}>
                    {tier.icon}
                  </span>
                  <h3 className="font-bold text-lg" style={{ color: tier.color }}>
                    {tier.level}
                  </h3>
                  <p className="text-3xl font-bold text-[#1a1a17] my-2">-{tier.discount}</p>
                  <p className="text-xs text-[#5a5a52] mb-3">Tổng chi tiêu từ {tier.minOrder}</p>
                  <ul className="space-y-1">
                    {tier.perks.map((p) => (
                      <li key={p} className="text-sm text-[#5a5a52] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm" style={{ color: tier.color }}>
                          check_circle
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mã ưu đãi hiện có — giữ tính năng sao chép mã */}
        <section className="bg-[#fafaf8] pb-10">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="rounded-2xl border border-[#86ddb1]/60 bg-[#f0faf4] px-5 py-4
                            flex flex-col md:flex-row items-center gap-3 md:gap-6 justify-between">
              <p className="text-sm font-semibold text-[#1a8a54] uppercase tracking-widest">
                Mã ưu đãi hiện có
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {PROMO_CODES.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => copyCode(p.code)}
                    title={p.label}
                    className="inline-flex items-center gap-2 pl-4 pr-3 py-2 rounded-full bg-white
                               border border-[#1a8a54]/30 hover:border-[#1a8a54] transition-colors group"
                  >
                    <span className="text-sm font-semibold uppercase tracking-wider text-[#1a8a54]">
                      {p.code}
                    </span>
                    <span className="material-symbols-outlined text-sm text-[#5a5a52] group-hover:text-[#1a8a54]">
                      {copied === p.code ? 'check' : 'content_copy'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ SECTION 3: DEAL HẤP DẪN HÔM NAY ═══════ */}
        <section id="deals" className="py-12 bg-[#fafaf8]">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#1a8a54] font-semibold mb-1">
                  ĐANG GIẢM GIÁ
                </p>
                <h2 className="text-3xl font-bold text-[#1a1a17] font-display">Deal Hấp Dẫn Hôm Nay</h2>
              </div>
              <Link href="/products" className="text-sm text-[#1a8a54] hover:underline flex items-center gap-1">
                Xem tất cả
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            {loadState === 'loading' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/70 animate-pulse h-[300px]" />
                ))}
              </div>
            )}

            {loadState === 'success' && deals.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#86ddb1]/50">
                <span className="material-symbols-outlined text-5xl text-[#9a9a90]">sell</span>
                <p className="text-[#5a5a52] mt-4">Hiện chưa có sản phẩm đang giảm giá. Ghé lại sau nhé!</p>
              </div>
            )}

            {loadState === 'success' && deals.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {deals.map((p) => {
                  const v = p.variants?.find((vv) => vv.isDiscountActive) ?? p.variants?.[0];
                  const price = v?.price ?? 0;
                  const compare = v?.compareAtPrice ?? 0;
                  const off = compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
                  const img = resolveImageUrl(p.thumbnailUrl);
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="group relative bg-white rounded-2xl border border-[#e6e6df]
                                 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-square bg-[#f4f4f0] overflow-hidden">
                        {img ? (
                          <Image src={img} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw"
                                 className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-[#c9d8cd]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                          </div>
                        )}
                        {off > 0 && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1a8a54] text-white text-xs font-bold">
                            -{off}%
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col gap-2 flex-grow">
                        <h3 className="font-semibold text-[#1a1a17] line-clamp-2">{p.name}</h3>
                        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                          <div>
                            {compare > price && (
                              <span className="block text-sm text-[#9a9a90] line-through">{formatPrice(compare)}</span>
                            )}
                            <span className="text-lg font-semibold text-[#1a8a54]">{formatPrice(price)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══════ SECTION 4: COMBO MUA KÈM ═══════ */}
        <section className="py-12 bg-gradient-to-b from-[#fafaf8] to-[#f0faf4]">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-widest text-[#1a8a54] font-semibold mb-2">
                COMBO TIẾT KIỆM
              </p>
              <h2 className="text-3xl font-bold text-[#1a1a17] font-display">Mua Combo, Tiết Kiệm Hơn</h2>
              <p className="text-[#5a5a52] mt-2">Kết hợp các sản phẩm bổ trợ nhau, tiết kiệm đến 20%</p>
            </div>

            {/* 2x2 grid combo cards — lớn, visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Combo Tim Mạch', icon: 'favorite',
                  color: '#dc2626', bg: 'from-red-50 to-rose-100',
                  desc: 'Ích Tâm Khang + Hạnh Phúc Huyết Áp',
                  save: '15%', price: '720.000đ', original: '850.000đ' },
                { name: 'Combo Xương Khớp', icon: 'self_improvement',
                  color: '#d97706', bg: 'from-amber-50 to-orange-100',
                  desc: 'Cốt Thoái Vương + Khớp Tâm Bình',
                  save: '12%', price: '560.000đ', original: '630.000đ' },
                { name: 'Combo Tiêu Hóa', icon: 'spa',
                  color: '#059669', bg: 'from-emerald-50 to-green-100',
                  desc: 'Tràng Phục Linh + Tiêu Hóa Khang',
                  save: '10%', price: '420.000đ', original: '470.000đ' },
                { name: 'Combo An Thần', icon: 'bedtime',
                  color: '#7c3aed', bg: 'from-violet-50 to-purple-100',
                  desc: 'Ngủ Ngon Thảo Mộc + An Thần Tâm Bình',
                  save: '18%', price: '490.000đ', original: '600.000đ' },
              ].map((combo) => (
                <div
                  key={combo.name}
                  className={`rounded-2xl p-6 bg-gradient-to-br ${combo.bg}
                             border border-white/60 hover:shadow-lg transition-all duration-200
                             cursor-pointer hover:-translate-y-1 group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-3xl" style={{ color: combo.color }}>
                        {combo.icon}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ background: combo.color }}>
                      -{combo.save}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-[#1a1a17] mb-1 font-display">{combo.name}</h3>
                  <p className="text-sm text-[#5a5a52] mb-4">{combo.desc}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold" style={{ color: combo.color }}>{combo.price}</span>
                      <span className="text-sm text-[#9a9a90] line-through ml-2">{combo.original}</span>
                    </div>
                    <Link
                      href="/products"
                      className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 group-hover:shadow-md"
                      style={{ background: combo.color }}
                    >
                      Mua ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
