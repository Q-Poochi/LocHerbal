'use client';

import Link from 'next/link';

const POSTS = [
  {
    id: '1',
    category: 'Tim Mạch',
    categoryColor: 'bg-rose-100 text-rose-700',
    title: 'Top 5 thảo dược hỗ trợ sức khỏe tim mạch hiệu quả nhất',
    excerpt: 'Khám phá những loại thảo dược quý từ thiên nhiên đã được y học cổ truyền và hiện đại chứng minh hiệu quả...',
    readTime: '5 phút đọc',
    icon: 'favorite',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-400',
  },
  {
    id: '2',
    category: 'Xương Khớp',
    categoryColor: 'bg-amber-100 text-amber-700',
    title: 'Glucosamine và Chondroitin — giải pháp tái tạo sụn khớp từ thiên nhiên',
    excerpt: 'Tìm hiểu cơ chế hoạt động của Glucosamine và Chondroitin trong quá trình tái tạo và bảo vệ sụn khớp...',
    readTime: '7 phút đọc',
    icon: 'accessibility_new',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-400',
  },
  {
    id: '3',
    category: 'An Thần',
    categoryColor: 'bg-indigo-100 text-indigo-700',
    title: 'Bí quyết ngủ ngon mỗi đêm với các bài thuốc an thần từ thảo mộc',
    excerpt: 'Giấc ngủ chất lượng là nền tảng của sức khỏe. Khám phá các giải pháp tự nhiên giúp bạn thư giãn và ngủ sâu...',
    readTime: '4 phút đọc',
    icon: 'bedtime',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-400',
  },
];

export default function BlogSection({ posts: _posts }: { posts: any[] }) {
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
        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {POSTS.map(post => (
            <article
              key={post.id}
              className="group bg-white rounded-2xl border border-border overflow-hidden
                         hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className={`aspect-video ${post.iconBg} flex items-center justify-center relative overflow-hidden`}>
                <span
                  className={`material-symbols-outlined ${post.iconColor} group-hover:scale-110 transition-transform duration-400`}
                  style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}
                >
                  {post.icon}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.categoryColor}`}>
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
      </div>
    </section>
  );
}
