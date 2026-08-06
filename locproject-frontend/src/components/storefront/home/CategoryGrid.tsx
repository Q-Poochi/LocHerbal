'use client';

import Link from 'next/link';

const CATEGORIES = [
  {
    name: 'Tim Mạch',
    href: '/products?categoryId=tim-mach',
    icon: 'favorite',
    count: 3,
    gradient: 'from-rose-50 to-red-100',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500',
    borderHover: 'hover:border-rose-300',
    desc: 'Hỗ trợ tim mạch, huyết áp',
  },
  {
    name: 'Xương Khớp',
    href: '/products?categoryId=xuong-khop',
    icon: 'accessibility_new',
    count: 3,
    gradient: 'from-amber-50 to-orange-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    desc: 'Tái tạo sụn khớp, chống thoái hóa',
  },
  {
    name: 'Tiêu Hóa',
    href: '/products?categoryId=tieu-hoa',
    icon: 'local_florist',
    count: 3,
    gradient: 'from-green-50 to-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    desc: 'Hỗ trợ dạ dày, đại tràng',
  },
  {
    name: 'An Thần',
    href: '/products?categoryId=an-than-ngu-ngon',
    icon: 'bedtime',
    count: 3,
    gradient: 'from-blue-50 to-indigo-100',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-500',
    borderHover: 'hover:border-indigo-300',
    desc: 'Cải thiện giấc ngủ, giảm căng thẳng',
  },
];

export default function CategoryGrid() {
  return (
    <section className="w-full py-16 md:py-20 bg-surface-alt">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
            <span className="material-symbols-outlined text-base">category</span>
            Chuyên khoa
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary tracking-tight">
            Mua Theo Chuyên Khoa
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto">
            Sản phẩm được phân loại theo từng chuyên khoa, giúp bạn dễ dàng tìm kiếm giải pháp phù hợp
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={`group relative bg-gradient-to-br ${cat.gradient} rounded-2xl p-5 border-2 border-transparent
                          ${cat.borderHover} hover:shadow-lg hover:scale-[1.03]
                          transition-all duration-250 cursor-pointer overflow-hidden`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <span
                  className={`material-symbols-outlined text-3xl ${cat.iconColor}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {cat.icon}
                </span>
              </div>

              {/* Text */}
              <h3 className="font-display font-bold text-base text-text-primary mb-1 group-hover:text-primary-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed mb-3">{cat.desc}</p>
              <p className="text-primary-600 text-xs font-semibold">{cat.count} sản phẩm</p>

              {/* Arrow */}
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/60 flex items-center justify-center
                              opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                <span className="material-symbols-outlined text-base text-primary-700">chevron_right</span>
              </div>

              {/* Decorative blob */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/30 group-hover:scale-150 transition-transform duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
