'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/storefront/layout/Navbar';
import Footer from '@/components/storefront/layout/Footer';
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
        {/* Nền riêng trang ưu đãi — ảnh (uu-dai.jpg) dạng CSS layer fixed:
            overlay sage RẤT NHẸ chỉ để dịu độ tương phản, giữ ảnh rõ nét (không đục).
            Chữ hero được đảm bảo đọc được bằng veil riêng trong section Hero.
            z-index -1 để ảnh nằm DƯỚI toàn bộ nội dung (z-0 positioned sẽ vẽ đè
            lên section thường — bug đã gặp trên /tu-van), nhưng vẫn trên
            BotanicalBackground toàn cục */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{
            zIndex: -1,
            backgroundColor: '#f8faf9',
            backgroundImage:
              'linear-gradient(180deg, rgba(233,241,234,0.28) 0%, rgba(186,208,191,0.08) 45%, rgba(231,239,232,0.40) 100%), url(/images/decor/uu-dai.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Hero */}
        <section className="w-full bg-transparent relative">
          {/* Veil cục bộ: gradient trắng mờ dần ngay sau hero để chữ dễ đọc
              mà không làm đục ảnh nền ở phần dưới trang */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8faf9]/85 via-[#f8faf9]/45 to-transparent"
          />
          <div className="relative mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] py-16 md:py-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tertiary/40
                             text-tertiary font-label-caps text-label-caps uppercase tracking-[0.1em] bg-white/40">
              <span className="material-symbols-outlined text-base">local_activity</span>
              Ưu đãi & quà tặng
            </span>
            <h1 className="text-display-lg md:text-headline-xl text-primary mt-5 leading-[1.1] tracking-[-0.02em] font-display font-bold">
              Chăm Sóc Sức Khỏe, Giá Ưu Đãi
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-5 max-w-2xl mx-auto">
              Nhận ngay ưu đãi hấp dẫn khi mua sắm tại LocHerbal — mã giảm giá, combo tiết kiệm
              và quà tặng thành viên. Sức khỏe xứng đáng với mức giá tốt nhất.
            </p>
          </div>
        </section>

        {/* Promo codes */}
        <section className="w-full py-8 bg-white/40 border-y border-outline-variant/40">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6 text-center">Mã ưu đãi đang chạy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROMO_CODES.map((p) => (
                <div key={p.code} className="bg-surface-container-lowest rounded-lg border border-outline-variant/40
                                            shadow-botanical hover:shadow-botanical-hover transition-shadow p-6 flex flex-col gap-3">
                  <p className="font-body-md text-body-md text-on-surface-variant">{p.label}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider border border-secondary/40
                                     rounded-full px-4 py-2">{p.code}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(p.code)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-on-primary
                                 font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">{copied === p.code ? 'check' : 'content_copy'}</span>
                      {copied === p.code ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured deals */}
        <section className="w-full py-16 md:py-20 bg-transparent">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px]">
            <div className="text-center mb-12">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.1em]">Sản phẩm giảm giá</span>
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary mt-2">Deal hấp dẫn hôm nay</h2>
            </div>

            {loadState === 'loading' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-surface-container-low animate-pulse h-[300px]" />
                ))}
              </div>
            )}

            {loadState === 'success' && deals.length === 0 && (
              <div className="text-center py-16 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">sell</span>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
                  Hiện chưa có sản phẩm đang giảm giá. Ghé lại sau nhé!
                </p>
              </div>
            )}

            {loadState === 'success' && deals.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                      className="group relative bg-surface-container-lowest rounded-lg border border-outline-variant/50
                                 shadow-botanical hover:shadow-botanical-hover transition-shadow overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-square bg-surface-container-low overflow-hidden">
                        {img ? (
                          <Image src={img} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw"
                                 className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-primary-container/40" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                          </div>
                        )}
                        {off > 0 && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-tertiary text-on-primary text-xs font-bold">
                            -{off}%
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex flex-col gap-2 flex-grow">
                        <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-2">{p.name}</h3>
                        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                          <div>
                            {compare > price && (
                              <span className="block text-sm text-on-surface-variant line-through">{formatPrice(compare)}</span>
                            )}
                            <span className="font-body-lg text-body-lg font-semibold text-secondary">{formatPrice(price)}</span>
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


        {/* Combo / CTA */}
        <section className="w-full py-16 md:py-24 bg-primary text-on-primary">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-[64px] grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="font-label-caps text-label-caps text-on-primary/70 uppercase tracking-[0.1em]">Combo tiết kiệm</span>
              <h2 className="font-headline-lg text-headline-lg md:text-headline-xl mt-3 leading-tight">Mua combo, tiết kiệm hơn</h2>
              <p className="font-body-lg text-body-lg text-on-primary/80 mt-4">
                Ghép các sản phẩm bổ trợ cho nhau thành liệu trình hoàn chỉnh với mức giá ưu đãi.
                Liên hệ để được tư vấn combo phù hợp nhất.
              </p>
              <Link
                href="/tu-van"
                className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full
                           bg-on-primary text-primary font-label-caps text-label-caps uppercase
                           tracking-[0.1em] hover:bg-on-primary/90 transition-all duration-300"
              >
                Đặt lịch tư vấn <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'inventory_2', title: 'Combo Tim Mạch' },
                { icon: 'accessibility_new', title: 'Combo Xương Khớp' },
                { icon: 'local_florist', title: 'Combo Tiêu Hóa' },
                { icon: 'bedtime', title: 'Combo An Thần' },
              ].map((c) => (
                <div key={c.title} className="bg-on-primary/10 border border-on-primary/20 rounded-lg p-6 flex flex-col items-center gap-3 text-center">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                  <p className="font-headline-sm text-headline-sm">{c.title}</p>
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

