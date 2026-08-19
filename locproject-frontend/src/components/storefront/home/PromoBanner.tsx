'use client';

import Link from 'next/link';

export default function PromoBanner() {
  return (
    <section className="w-full py-16 md:py-20 bg-surface-alt">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 overflow-hidden
                        flex flex-col md:flex-row items-center shadow-xl">

          {/* Left — visual */}
          <div className="w-full md:w-2/5 min-h-[200px] md:min-h-[280px] relative
                          bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-10">
            <div className="text-center">
              <span
                className="material-symbols-outlined text-white/30"
                style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1" }}
              >
                groups
              </span>
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/5" />
          </div>

          {/* Right — text */}
          <div className="flex-1 p-8 md:p-12 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-sm font-medium mb-6">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                handshake
              </span>
              Cơ hội hợp tác
            </div>

            <h2 className="font-display font-bold text-2xl md:text-3xl mb-4 leading-tight text-balance">
              Chương trình đại lý &amp; cộng tác viên
            </h2>

            <p className="text-white/80 text-base leading-relaxed mb-8 max-w-lg">
              Trở thành đối tác của LocHerbal — cùng chúng tôi mang sản phẩm thảo dược cao cấp đến tay hàng triệu người Việt. Hoa hồng hấp dẫn, hỗ trợ đào tạo toàn diện.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary-700
                           font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                Tìm hiểu thêm
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/50
                           text-white font-semibold text-sm hover:bg-white/10 transition-all duration-200"
              >
                Khám phá sản phẩm
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/20">
              {[
                { val: '500+', label: 'Đại lý' },
                { val: '50K+', label: 'Khách hàng' },
                { val: '20%+', label: 'Hoa hồng' },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-display font-bold text-2xl">{s.val}</p>
                  <p className="text-white/75 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
