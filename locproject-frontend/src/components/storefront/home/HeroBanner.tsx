'use client';

import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section
      data-testid="hero-title"
      className="w-full bg-gradient-to-br from-primary-50 via-white to-accent-gold-pale overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-16 md:py-24 lg:py-28
                      flex flex-col md:flex-row items-center gap-12 md:gap-16">

        {/* ── LEFT: Text ─────────────────────────────────────── */}
        <div className="flex-1 text-center md:text-left animate-fade-in-up">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
            Thảo dược thiên nhiên
          </div>

          {/* H1 */}
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl
                         text-primary-700 leading-[1.1] tracking-[-0.03em] mb-6">
            Chăm Sóc Sức Khỏe
            <br />
            <span className="text-primary-500">Từ Thiên Nhiên</span>
          </h1>

          {/* Subtitle */}
          <p className="text-text-secondary text-lg leading-relaxed max-w-lg mb-8 mx-auto md:mx-0">
            Sản phẩm thảo dược cao cấp, được nghiên cứu theo y học cổ truyền kết hợp công nghệ hiện đại. Chăm sóc sức khỏe từ gốc rễ, bền vững và an toàn.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                         bg-primary-700 text-white font-semibold text-base
                         hover:bg-primary-800 hover:scale-[1.02] hover:shadow-lg
                         transition-all duration-200 shadow-md"
            >
              <span className="material-symbols-outlined text-xl">storefront</span>
              Khám phá sản phẩm
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
                         border-2 border-primary-700 text-primary-700 font-semibold text-base
                         hover:bg-primary-50 hover:scale-[1.02]
                         transition-all duration-200"
            >
              <span className="material-symbols-outlined text-xl">support_agent</span>
              Tư vấn miễn phí
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-10 justify-center md:justify-start">
            <div className="text-center">
              <p className="font-display font-bold text-2xl text-primary-700">200+</p>
              <p className="text-xs text-text-secondary mt-0.5">Sản phẩm</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="font-display font-bold text-2xl text-primary-700">10K+</p>
              <p className="text-xs text-text-secondary mt-0.5">Khách hàng</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <span className="font-display font-bold text-2xl text-primary-700">4.8</span>
                <span className="material-symbols-outlined text-accent-gold text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">Đánh giá</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Visual ──────────────────────────────────── */}
        <div className="flex-1 relative flex items-center justify-center" style={{ animationDelay: '200ms' }}>
          <div className="relative w-full max-w-sm md:max-w-md animate-scale-in" style={{ animationDelay: '200ms' }}>
            {/* Main image area */}
            <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary-100 via-primary-50 to-primary-200
                            overflow-hidden shadow-xl flex items-center justify-center relative">
              <div className="text-center p-8">
                <span
                  className="material-symbols-outlined text-primary-300"
                  style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}
                >
                  local_pharmacy
                </span>
                <p className="text-primary-400 font-medium mt-4">Sản phẩm thảo dược thiên nhiên</p>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-200/30 to-transparent pointer-events-none" />
            </div>

            {/* Floating badge 1 */}
            <div
              className="absolute -left-6 top-12 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2
                         animate-bounce-in border border-border"
              style={{ animationDelay: '400ms', transform: 'rotate(-6deg)' }}
            >
              <span className="material-symbols-outlined text-accent-gold text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              <div>
                <p className="font-bold text-sm text-text-primary">200+</p>
                <p className="text-xs text-text-secondary">sản phẩm</p>
              </div>
            </div>

            {/* Floating badge 2 */}
            <div
              className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2
                         animate-bounce-in border border-border"
              style={{ animationDelay: '500ms', transform: 'rotate(4deg)' }}
            >
              <span className="material-symbols-outlined text-accent-gold text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <div>
                <p className="font-bold text-sm text-text-primary">★ 4.8</p>
                <p className="text-xs text-text-secondary">đánh giá</p>
              </div>
            </div>

            {/* Decorative circle */}
            <div className="absolute -z-10 -bottom-8 -right-8 w-64 h-64 rounded-full bg-primary-100/60 blur-2xl" />
            <div className="absolute -z-10 -top-8 -left-8 w-48 h-48 rounded-full bg-accent-gold-pale/80 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
